import io
import ipaddress
import os
import socket
import subprocess
import tempfile
from urllib.parse import urlsplit

from pypdf import PdfReader

from multiagentcrew import ACTIVE_FAQ_PATH

MAX_PDF_BYTES = 5 * 1024 * 1024


def download_pdf(url: str) -> bytes:
    address = urlsplit(url)
    host = address.hostname
    if address.scheme != "https" or not host or address.username or address.password or address.port not in (443, None):
        raise ValueError("Enter a public HTTPS PDF URL.")

    records = socket.getaddrinfo(host, 443, socket.AF_INET, socket.SOCK_STREAM)
    ips = [record[4][0] for record in records]
    if not ips or any(not ipaddress.ip_address(ip).is_global for ip in ips):
        raise ValueError("Enter a public HTTPS PDF URL.")

    # Pin the validated public address while retaining TLS verification for the hostname.
    result = subprocess.run(
        ["curl", "-q", "--fail", "--silent", "--noproxy", "*", "--proto", "=https",
         "--max-time", "12", "--max-filesize", str(MAX_PDF_BYTES),
         "--resolve", f"{host}:443:{ips[0]}", "--", url],
        capture_output=True, timeout=15, check=True,
    )
    return result.stdout


def replace_faq(content: bytes) -> None:
    if not content.startswith(b"%PDF-") or len(content) > MAX_PDF_BYTES:
        raise ValueError("Choose a PDF no larger than 5 MB.")
    try:
        reader = PdfReader(io.BytesIO(content))
        if reader.is_encrypted or not 1 <= len(reader.pages) <= 20:
            raise ValueError
        extracted = "".join(page.extract_text() for page in reader.pages)
        if not extracted.strip() or len(extracted) > 30_000:
            raise ValueError
    except Exception:
        raise ValueError("Choose an unlocked PDF with selectable text, up to 20 pages and 30,000 characters.") from None

    ACTIVE_FAQ_PATH.parent.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=ACTIVE_FAQ_PATH.parent, delete=False) as temporary:
        temporary_path = temporary.name
        try:
            temporary.write(content)
            temporary.close()
            os.replace(temporary_path, ACTIVE_FAQ_PATH)
        finally:
            if os.path.exists(temporary_path):
                os.unlink(temporary_path)
