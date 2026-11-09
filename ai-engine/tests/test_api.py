import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["cv_backend"] == "opencv"


def test_sketch_conversion():
    payload = {
        "imageUri": "test_synthetic.png",
        "options": {
            "style": "graphite",
            "intensity": 60,
            "contrast": 50,
            "brightness": 50,
            "detailLevel": 50,
            "edgeStrength": 50,
            "grayscale": True,
            "paperTexture": False,
        },
    }
    response = client.post("/api/v1/sketch/convert", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "data:image/png;base64," in data["uri"]
    assert data["style"] == "graphite"


def test_line_art_cleaner():
    payload = {
        "imageUri": "test_synthetic.png",
        "options": {
            "binarizeThreshold": 128,
            "removeScannerGrain": True,
            "enhanceContrast": True,
            "smoothContours": True,
        },
    }
    response = client.post("/api/v1/linecleaner/clean", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["binarized"] is True
    assert data["grainRemoved"] is True


def test_segmentation():
    payload = {
        "imageUri": "test_synthetic.png",
        "tolerance": 25.0,
        "feathering": 3.0,
    }
    response = client.post("/api/v1/segmentation/separate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "foregroundUri" in data
    assert "maskUri" in data


def test_pose_detection():
    payload = {"width": 800, "height": 800}
    response = client.post("/api/v1/pose/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["landmarks"]) > 0
    assert "lineOfAction" in data
    assert data["isBalanced"] is True


def test_hand_detection():
    payload = {"type": "hand", "width": 800, "height": 800}
    response = client.post("/api/v1/handfoot/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["landmarks"]) > 0
    assert data["proportions"]["isProportional"] is True


def test_vectorizer():
    payload = {
        "imageUri": "test_synthetic.png",
        "options": {
            "pathTolerance": 2.5,
            "curveSmoothness": 1.0,
            "cornerThreshold": 45.0,
            "exportSvgXml": True,
        },
    }
    response = client.post("/api/v1/vectorize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "<svg" in data["svgXml"]
    assert data["pathCount"] >= 1
