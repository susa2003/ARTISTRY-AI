import numpy as np
from PIL import Image, ImageFilter, ImageOps
from app.processors.image_utils import decode_image_data, encode_image_data

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


def convert_to_sketch(image_uri: str, options: dict) -> str:
    """Applies authentic artistic sketch filters using OpenCV or PIL fallback."""
    img_rgb = decode_image_data(image_uri)
    style = options.get("style", "graphite").lower()
    intensity = float(options.get("intensity", 50.0)) / 100.0

    if HAS_OPENCV:
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        inverted = 255 - gray
        blurred = cv2.GaussianBlur(inverted, (21, 21), 0)

        # Color dodge blend: (image / (255 - blurred)) * 255
        dodge = cv2.divide(gray, 255 - blurred, scale=256.0)

        if style in ["charcoal", "ink", "lineart"]:
            # High-contrast thresholding for ink/charcoal
            thresh = int(255 * (1.0 - (intensity * 0.4)))
            _, binary = cv2.threshold(dodge, thresh, 255, cv2.THRESH_BINARY)
            output = binary
        else:
            # Subtle pencil sketch
            output = dodge

        return encode_image_data(output, "PNG")

    # PIL Fallback
    pil_img = Image.fromarray(img_rgb).convert("L")
    inv = ImageOps.invert(pil_img)
    blur = inv.filter(ImageFilter.GaussianBlur(radius=8))

    # Dodge simulation in numpy
    img_arr = np.array(pil_img, dtype=float)
    blur_arr = np.array(blur, dtype=float)
    denominator = 255.0 - blur_arr
    denominator[denominator == 0] = 1.0
    dodge_arr = np.clip((img_arr * 255.0) / denominator, 0, 255).astype(np.uint8)

    return encode_image_data(dodge_arr, "PNG")
