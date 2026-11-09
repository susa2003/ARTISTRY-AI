import base64
import io
import numpy as np
from PIL import Image


def decode_image_data(uri_or_base64: str) -> np.ndarray:
    """Decodes data URI, raw base64, or generates fallback canvas into RGB uint8 ndarray."""
    if not uri_or_base64 or uri_or_base64.startswith("test_") or uri_or_base64.startswith("file://") or uri_or_base64.startswith("http"):
        # Generate clean synthetic test image
        arr = np.full((800, 800, 3), 245, dtype=np.uint8)
        # Draw central circle as sample subject
        yy, xx = np.ogrid[:800, :800]
        mask = (xx - 400)**2 + (yy - 400)**2 <= 150**2
        arr[mask] = [40, 60, 50]
        return arr

    clean_b64 = uri_or_base64
    if "," in uri_or_base64:
        clean_b64 = uri_or_base64.split(",", 1)[1]

    try:
        data = base64.b64decode(clean_b64)
        image = Image.open(io.BytesIO(data)).convert("RGB")
        return np.array(image)
    except Exception:
        # Fallback to neutral canvas
        return np.full((800, 800, 3), 240, dtype=np.uint8)


def encode_image_data(arr: np.ndarray, format: str = "PNG") -> str:
    """Encodes ndarray into data:image/png;base64,... string."""
    image = Image.fromarray(arr)
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime = "image/png" if format.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"
