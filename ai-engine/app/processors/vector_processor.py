import cv2
import numpy as np
from app.processors.image_utils import decode_image_data


def vectorize_image(image_uri: str, options: dict) -> dict:
    """Extracts vector contours from image using OpenCV findContours and approxPolyDP."""
    img_rgb = decode_image_data(image_uri)
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

    tolerance = float(options.get("pathTolerance", 2.5))
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    svg_paths = []
    total_points = 0

    h, w = gray.shape[:2]

    for c in contours:
        if cv2.contourArea(c) < 20:
            continue
        approx = cv2.approxPolyDP(c, tolerance, True)
        total_points += len(approx)

        if len(approx) > 1:
            d_parts = [f"M {approx[0][0][0]} {approx[0][0][1]}"]
            for pt in approx[1:]:
                d_parts.append(f"L {pt[0][0]} {pt[0][1]}")
            d_parts.append("Z")
            svg_paths.append(" ".join(d_parts))

    path_data = "\n    ".join([f'<path d="{p}" fill="none" stroke="#17201C" stroke-width="2"/>' for p in svg_paths])
    svg_xml = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
    {path_data}
</svg>"""

    return {
        "svgXml": svg_xml,
        "pathCount": len(svg_paths),
        "pointCount": total_points,
        "fileSizeKb": round(len(svg_xml.encode("utf-8")) / 1024.0, 2),
        "engine": "opencv_approxPolyDP",
    }
