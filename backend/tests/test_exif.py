import io

from PIL import Image

from app.services.exif import exif_service


def test_no_exif_returns_all_none() -> None:
    """An image with no EXIF yields has_exif=False and null fields."""
    image = Image.new("RGB", (100, 100), (10, 20, 30))
    result = exif_service.extract_exif(image)

    assert result["has_exif"] is False
    assert result["make"] is None
    assert result["iso"] is None
    assert result["gps"] is None


def test_with_exif_make_and_model_roundtrip() -> None:
    """Make/Model written into a real JPEG are read back out."""
    image = Image.new("RGB", (100, 100), (10, 20, 30))
    exif = image.getexif()
    exif[0x010F] = "FUJIFILM"
    exif[0x0110] = "X-T5"

    buf = io.BytesIO()
    image.save(buf, format="JPEG", exif=exif)
    reloaded = Image.open(io.BytesIO(buf.getvalue()))

    result = exif_service.extract_exif(reloaded)
    assert result["has_exif"] is True
    assert result["make"] == "FUJIFILM"
    assert result["model"] == "X-T5"


def test_parse_exif_formats_exposure_fields() -> None:
    """Pure parser formats ISO, aperture, shutter and focal length nicely."""
    ifd0 = {0x010F: "Canon", 0x0110: "EOS R6"}
    exif_ifd = {
        0xA434: "RF50mm F1.8 STM",
        0x8827: 400,
        0x829D: 1.8,
        0x829A: 0.005,  # 1/200s
        0x920A: 50.0,
        0x9003: "2026:06:30 09:54:12",
    }

    result = exif_service.parse_exif(ifd0, exif_ifd, {})

    assert result["has_exif"] is True
    assert result["lens"] == "RF50mm F1.8 STM"
    assert result["iso"] == 400
    assert result["aperture"] == "f/1.8"
    assert result["shutter_speed"] == "1/200 s"
    assert result["focal_length"] == "50 mm"
    assert result["date_taken"] == "2026-06-30 09:54:12"


def test_parse_exif_converts_gps_to_decimal() -> None:
    gps_ifd = {
        1: "N",
        2: (37.0, 30.0, 0.0),
        3: "W",
        4: (122.0, 15.0, 0.0),
    }
    result = exif_service.parse_exif({}, {}, gps_ifd)

    assert result["gps"] == {"latitude": 37.5, "longitude": -122.25}
