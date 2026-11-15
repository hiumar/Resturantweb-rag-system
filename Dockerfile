FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY web_api.py faq_admin.py multiagentcrew.py restaurant_branding.py restaurant_menu.py restaurant_offers.py ./
COPY frontend/restaurant.json frontend/restaurant.json
COPY output/pdf/Pakfood_FAQ.pdf output/pdf/Pakfood_FAQ.pdf

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "web_api:app", "--host", "0.0.0.0", "--port", "8000"]
