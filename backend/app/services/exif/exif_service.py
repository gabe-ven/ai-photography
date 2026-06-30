"""EXIF metadata extraction.

Design goals:
- Never throw on malformed/missing metadata — every field defaults to None.
- Keep the parsing logic pure and decoupled from Pillow so it's trivial to test:
  `extract_exif(image)` pulls the raw IFD dicts out of a PIL image, then
  `parse_exif(...)` (a pure function) turns those plain dicts into our schema.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from PIL import Image

# --- EXIF tag IDs (see EXIF spec / PIL.ExifTags) ---------------------------
_EXIF_IFD = 0x8769
_GPS_IFD = 0x8825

# IFD0
_MAKE = 0x010F
_MODEL = 0x0110

# Exif sub-IFD
_EXPOSURE_TIME = 0x829A
_F_NUMBER = 0x829D
_ISO = 0x8827
_DATE_TAKEN = 0x9003  # DateTimeOriginal
_FOCAL_LENGTH = 0x920A
_LENS_MODEL = 0xA434

# GPS sub-IFD
_GPS_LAT_REF = 1
_GPS_LAT = 2
_GPS_LON_REF = 3
_GPS_LON = 4


def extract_exif(image: Image.Image) -> dict[str, Any]:
    """Read EXIF from a PIL image and return our normalized dict."""
    try:
        exif = image.getexif()
    except Exception:
        return parse_exif({}, {}, {})

    ifd0 = dict(exif)
    exif_ifd = _safe_get_ifd(exif, _EXIF_IFD)
    gps_ifd = _safe_get_ifd(exif, _GPS_IFD)
    return parse_exif(ifd0, exif_ifd, gps_ifd)


def parse_exif(
    ifd0: dict[Any, Any],
    exif_ifd: dict[Any, Any],
    gps_ifd: dict[Any, Any],
) -> dict[str, Any]:
    """Pure transform from raw EXIF IFD dicts to our normalized fields.

    Pure (no Pillow/image dependency) so tests can feed plain dicts.
    """
    fields = {
        "make": _clean_str(ifd0.get(_MAKE)),
        "model": _clean_str(ifd0.get(_MODEL)),
        "lens": _clean_str(exif_ifd.get(_LENS_MODEL)),
        "iso": _parse_iso(exif_ifd.get(_ISO)),
        "aperture": _format_aperture(exif_ifd.get(_F_NUMBER)),
        "shutter_speed": _format_shutter(exif_ifd.get(_EXPOSURE_TIME)),
        "focal_length": _format_focal_length(exif_ifd.get(_FOCAL_LENGTH)),
        "date_taken": _format_date(exif_ifd.get(_DATE_TAKEN)),
        "gps": _parse_gps(gps_ifd),
    }
    has_exif = any(value is not None for value in fields.values())
    return {"has_exif": has_exif, **fields}


# --- helpers ---------------------------------------------------------------


def _safe_get_ifd(exif: Any, tag: int) -> dict[Any, Any]:
    try:
        return dict(exif.get_ifd(tag))
    except Exception:
        return {}


def _clean_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="ignore")
    text = str(value).strip().rstrip("\x00").strip()
    return text or None


def _to_float(value: Any) -> float | None:
    try:
        if isinstance(value, (tuple, list)) and len(value) == 2:
            return value[0] / value[1] if value[1] else None
        return float(value)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def _parse_iso(value: Any) -> int | None:
    if isinstance(value, (tuple, list)):
        value = value[0] if value else None
    f = _to_float(value)
    return int(f) if f is not None else None


def _format_aperture(value: Any) -> str | None:
    f = _to_float(value)
    if f is None or f <= 0:
        return None
    return f"f/{int(f)}" if f == int(f) else f"f/{f:.1f}"


def _format_shutter(value: Any) -> str | None:
    f = _to_float(value)
    if f is None or f <= 0:
        return None
    if f >= 1:
        return f"{int(f)} s" if f == int(f) else f"{f:.1f} s"
    return f"1/{round(1 / f)} s"


def _format_focal_length(value: Any) -> str | None:
    f = _to_float(value)
    if f is None or f <= 0:
        return None
    return f"{int(f)} mm" if f == int(f) else f"{f:.1f} mm"


def _format_date(value: Any) -> str | None:
    text = _clean_str(value)
    if not text:
        return None
    try:
        dt = datetime.strptime(text, "%Y:%m:%d %H:%M:%S")
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return text


def _parse_gps(gps_ifd: dict[Any, Any]) -> dict[str, float] | None:
    if not gps_ifd:
        return None
    lat = _dms_to_decimal(gps_ifd.get(_GPS_LAT), gps_ifd.get(_GPS_LAT_REF))
    lon = _dms_to_decimal(gps_ifd.get(_GPS_LON), gps_ifd.get(_GPS_LON_REF))
    if lat is None or lon is None:
        return None
    return {"latitude": round(lat, 6), "longitude": round(lon, 6)}


def _dms_to_decimal(dms: Any, ref: Any) -> float | None:
    if not isinstance(dms, (tuple, list)) or len(dms) != 3:
        return None
    degrees = _to_float(dms[0])
    minutes = _to_float(dms[1])
    seconds = _to_float(dms[2])
    if None in (degrees, minutes, seconds):
        return None
    decimal = degrees + minutes / 60 + seconds / 3600
    if isinstance(ref, bytes):
        ref = ref.decode("ascii", errors="ignore")
    if str(ref).upper() in ("S", "W"):
        decimal = -decimal
    return decimal
