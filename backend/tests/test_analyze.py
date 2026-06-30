import io

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def _png_bytes(size: tuple[int, int] = (800, 600)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, (120, 120, 120)).save(buf, format="PNG")
    return buf.getvalue()


def test_analyze_returns_image_info() -> None:
    files = {"file": ("test.png", _png_bytes(), "image/png")}
    response = client.post("/api/analyze", files=files)

    assert response.status_code == 200
    info = response.json()["image"]
    assert info["width"] == 800
    assert info["height"] == 600
    assert info["format"] == "PNG"


def test_analyze_rejects_non_image() -> None:
    files = {"file": ("notes.txt", b"hello world", "text/plain")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 422
