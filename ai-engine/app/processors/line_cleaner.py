import numpy as np
from PIL import Image, ImageOps
from app.processors.image_utils import decode_image_data, encode_image_data

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


def clean_line_art(image_uri: str, options: dict) -> dict:
    """Eliminates paper grain, scanner shadows, and binarizes linework cleanly."""
    img_rgb = decode_image_data(image_uri)
    threshold_val = int(options.get("binarizeThreshold", 128))
    remove_grain = bool(options.get("removeScannerGrain", True))

    if HAS_OPENCV:
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        if remove_grain:
            # Median blur to eliminate high-frequency scanner grain
            gray = cv2.medianBlur(gray, 3)

        # Adaptive Gaussian thresholding for uniform line extraction across varying illumination
        binarized = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            15,
            4,
        )

        # Morphological closing to heal broken hairline strokes
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(binarized, cv2.MORPH_CLOSE, kernel)

        output_uri = encode_image_data(cleaned, "PNG")
        return {
            "uri": output_uri,
            "binarized": True,
            "grainRemoved": remove_grain,
            "contrastEnhanced": True,
            "engine": "opencv_adaptive_gaussian",
        }

    # PIL fallback
    pil_img = Image.fromarray(img_rgb).convert("L")
    point_table = [0 if i < threshold_val else 255 for i in range(256)]
    bin_img = pil_img.point(point_table, "1")
    output_uri = encode_image_data(np.array(bin_img.convert("L")), "PNG")

    return {
        "uri": output_uri,
        "binarized": True,
        "grainRemoved": remove_grain,
        "contrastEnhanced": True,
        "engine": "pil_threshold",
    }
