import base64
import binascii
import hashlib
import hmac
import logging
import subprocess
import os
import re
from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError
from starlette.concurrency import run_in_threadpool

from faq_admin import MAX_PDF_BYTES, download_pdf, replace_faq
from multiagentcrew import LocalModelUnavailable, RESTAURANT, RESTAURANT_NAME, active_faq_path, answer_question
from restaurant_branding import MAX_LOGO_BYTES, normalize_image, normalize_logo, read_branding, save_branding
from restaurant_menu import add_menu_item, list_menu_items, read_menu_image
from restaurant_offers import add_offer, dubai_today, list_offers, remove_offer

app = FastAPI(title=RESTAURANT_NAME)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def require_backend_token(request: Request, call_next):
    expected = os.getenv("CREW_API_TOKEN", "")
    supplied = request.headers.get("x-crew-api-token", "")
    if expected and not hmac.compare_digest(expected.encode(), supplied.encode()):
        return JSONResponse({"detail": "Unauthorized."}, status_code=401)
    return await call_next(request)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    history: list[Message] = Field(default_factory=list, max_length=8)


@app.get("/faq")
def faq():
    return FileResponse(active_faq_path(), media_type="application/pdf", headers={"Cache-Control": "no-store"})


@app.post("/chat")
def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(422, "Enter a question.")

    phone = os.getenv("RESTAURANT_PHONE", "").strip() or RESTAURANT["phone"]
    contact = f"tel:{phone}" if re.fullmatch(r"\+?[0-9]{7,15}", phone) else None
    try:
        reply = answer_question(question, [message.model_dump() for message in request.history])
    except LocalModelUnavailable as error:
        logger.warning("Local Llama unavailable: %s", error)
        raise HTTPException(503, "The local assistant is unavailable. Please try again shortly.") from None
    except Exception as error:
        logger.warning("Restaurant assistant failed (%s)", type(error).__name__)
        raise HTTPException(502, "The assistant is temporarily unavailable.") from None

    return {
        "answer": reply.answer,
        "faq": reply.used_faq,
        "staff": reply.refer_to_staff,
        "contact": contact if reply.refer_to_staff and os.getenv("PAK_FOOD_DEMO") != "1" else None,
    }


def require_admin(request: Request) -> None:
    password = os.getenv("FAQ_ADMIN_PASSWORD", "")
    if not password:
        raise HTTPException(503, "Set FAQ_ADMIN_PASSWORD in the project .env file.")
    supplied = request.headers.get("x-admin-password", "")
    if not hmac.compare_digest(password.encode(), supplied.encode()):
        raise HTTPException(401, "Incorrect admin password.")


@app.put("/admin/faq")
async def update_faq(request: Request):
    require_admin(request)

    try:
        if request.headers.get("content-type") == "application/pdf":
            content = bytearray()
            async for chunk in request.stream():
                if len(content) + len(chunk) > MAX_PDF_BYTES:
                    raise HTTPException(413, "Choose a PDF no larger than 5 MB.")
                content.extend(chunk)
            content = bytes(content)
        else:
            payload = bytearray()
            async for chunk in request.stream():
                if len(payload) + len(chunk) > 4096:
                    raise HTTPException(413, "PDF URL is too long.")
                payload.extend(chunk)
            data = TypeAdapter(dict[str, str]).validate_json(payload)
            content = await run_in_threadpool(download_pdf, data.get("url", ""))
        await run_in_threadpool(replace_faq, content)
    except (OSError, subprocess.SubprocessError):
        raise HTTPException(422, "Could not retrieve the PDF. Use a direct HTTPS URL or upload it.") from None
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    return {"message": "The new FAQ is active."}


@app.get("/branding")
def branding():
    name, logo = read_branding()
    return {
        "name": name or RESTAURANT_NAME,
        "logoVersion": hashlib.sha256(logo).hexdigest() if logo is not None else None,
    }


@app.get("/branding/logo")
def branding_logo():
    _, logo = read_branding()
    if logo is None:
        raise HTTPException(404, "No custom logo uploaded.")
    return Response(logo, media_type="image/png", headers={"Cache-Control": "no-store"})


@app.put("/admin/branding")
async def update_branding(request: Request):
    require_admin(request)
    is_name = request.headers.get("content-type") == "application/json"
    limit = 4096 if is_name else MAX_LOGO_BYTES
    content = bytearray()
    async for chunk in request.stream():
        if len(content) + len(chunk) > limit:
            raise HTTPException(413, "The logo must be 2 MB or smaller." if not is_name else "The name is too long.")
        content.extend(chunk)
    try:
        if is_name:
            data = TypeAdapter(dict[str, str]).validate_json(content)
            name = data.get("name", "").strip()
            if not 1 <= len(name) <= 80 or not name.isprintable():
                raise ValueError("Enter a restaurant name between 1 and 80 characters.")
            await run_in_threadpool(save_branding, name=name)
        else:
            logo = await run_in_threadpool(normalize_logo, bytes(content))
            await run_in_threadpool(save_branding, logo=logo)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    return {"message": "Restaurant name saved." if is_name else "Restaurant logo saved."}


MAX_MENU_IMAGE_BYTES = 2 * 1024 * 1024
MAX_ENCODED_MENU_IMAGE = ((MAX_MENU_IMAGE_BYTES + 2) // 3) * 4


class MenuItemRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=400)
    price: str = Field(default="", max_length=32)
    image: str = Field(default="", max_length=MAX_ENCODED_MENU_IMAGE)


@app.get("/menu")
def menu():
    return list_menu_items()


@app.get("/menu/{item_id}/image")
def menu_image(item_id: int):
    image = read_menu_image(item_id)
    if image is None:
        raise HTTPException(404, "Menu photo not found.")
    return Response(image, media_type="image/webp")


@app.post("/admin/menu", status_code=201)
async def create_menu_item(request: Request):
    require_admin(request)
    content = bytearray()
    async for chunk in request.stream():
        if len(content) + len(chunk) > MAX_ENCODED_MENU_IMAGE + 4096:
            raise HTTPException(413, "Choose an image no larger than 2 MB.")
        content.extend(chunk)

    try:
        item = MenuItemRequest.model_validate_json(content)
    except ValidationError:
        raise HTTPException(422, "Enter a dish name and description within the field limits.") from None

    image = None
    if item.image:
        try:
            raw = base64.b64decode(item.image, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(422, "Choose a valid menu photo.") from None
        if len(raw) > MAX_MENU_IMAGE_BYTES:
            raise HTTPException(413, "Choose an image no larger than 2 MB.")
        try:
            image = await run_in_threadpool(normalize_image, raw, size=1000, format="WEBP", label="photo")
        except ValueError as error:
            raise HTTPException(422, str(error)) from None

    await run_in_threadpool(add_menu_item, item.name, item.description, item.price, image)
    return {"message": "Menu item published."}


class OfferRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    kind: Literal["discount", "occasion"]
    title: str = Field(min_length=1, max_length=80)
    details: str = Field(min_length=1, max_length=400)
    ends_on: date | None = None


@app.get("/offers")
def offers():
    return list_offers()


@app.post("/admin/offers", status_code=201)
async def publish_offer(request: Request):
    require_admin(request)
    content = bytearray()
    async for chunk in request.stream():
        if len(content) + len(chunk) > 8192:
            raise HTTPException(413, "Offer details are too long.")
        content.extend(chunk)
    try:
        offer = OfferRequest.model_validate_json(content)
    except ValidationError:
        raise HTTPException(422, "Choose an offer type and enter a valid title, details, and end date.") from None

    if offer.ends_on and offer.ends_on < dubai_today():
        raise HTTPException(422, "Choose today or a future end date.")
    ends_on = offer.ends_on.isoformat() if offer.ends_on else None
    await run_in_threadpool(add_offer, offer.kind, offer.title, offer.details, ends_on)
    return {"message": "Offer published."}


@app.delete("/admin/offers/{offer_id}")
def unpublish_offer(offer_id: int, request: Request):
    require_admin(request)
    if not remove_offer(offer_id):
        raise HTTPException(404, "Offer not found.")
    return {"message": "Offer removed."}
