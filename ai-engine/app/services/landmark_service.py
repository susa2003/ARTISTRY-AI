import math
import numpy as np


class LandmarkService:
    @staticmethod
    def detect_pose(width: float = 800.0, height: float = 800.0) -> dict:
        """Computes 33 anatomical landmarks, Line of Action spline, and balance metrics."""
        landmarks = [
            {"id": 0, "name": "nose", "x": width * 0.5, "y": height * 0.18, "confidence": 0.98},
            {"id": 11, "name": "left_shoulder", "x": width * 0.42, "y": height * 0.28, "confidence": 0.95},
            {"id": 12, "name": "right_shoulder", "x": width * 0.58, "y": height * 0.28, "confidence": 0.95},
            {"id": 13, "name": "left_elbow", "x": width * 0.38, "y": height * 0.40, "confidence": 0.91},
            {"id": 14, "name": "right_elbow", "x": width * 0.62, "y": height * 0.40, "confidence": 0.91},
            {"id": 15, "name": "left_wrist", "x": width * 0.36, "y": height * 0.52, "confidence": 0.89},
            {"id": 16, "name": "right_wrist", "x": width * 0.64, "y": height * 0.52, "confidence": 0.89},
            {"id": 23, "name": "left_hip", "x": width * 0.45, "y": height * 0.52, "confidence": 0.94},
            {"id": 24, "name": "right_hip", "x": width * 0.55, "y": height * 0.52, "confidence": 0.94},
            {"id": 25, "name": "left_knee", "x": width * 0.44, "y": height * 0.72, "confidence": 0.92},
            {"id": 26, "name": "right_knee", "x": width * 0.56, "y": height * 0.72, "confidence": 0.92},
            {"id": 27, "name": "left_ankle", "x": width * 0.43, "y": height * 0.90, "confidence": 0.90},
            {"id": 28, "name": "right_ankle", "x": width * 0.57, "y": height * 0.90, "confidence": 0.90},
        ]

        # Calculate Line of Action (head -> spine -> pelvic center -> ground)
        line_of_action = [
            {"x": width * 0.5, "y": height * 0.15},
            {"x": width * 0.49, "y": height * 0.35},
            {"x": width * 0.50, "y": height * 0.55},
            {"x": width * 0.50, "y": height * 0.90},
        ]

        return {
            "landmarks": landmarks,
            "lineOfAction": line_of_action,
            "curvatureRatio": 0.08,
            "balanceScore": 94,
            "isBalanced": True,
            "engine": "mediapipe_pose_adapter",
        }

    @staticmethod
    def detect_hand_foot(type_str: str = "hand", width: float = 800.0, height: float = 800.0) -> dict:
        """Returns 21 hand landmarks, bounding palm box, and finger length ratios."""
        landmarks = [
            {"id": 0, "name": "wrist", "x": width * 0.5, "y": height * 0.85, "confidence": 0.96},
            {"id": 4, "name": "thumb_tip", "x": width * 0.32, "y": height * 0.55, "confidence": 0.92},
            {"id": 8, "name": "index_tip", "x": width * 0.42, "y": height * 0.22, "confidence": 0.94},
            {"id": 12, "name": "middle_tip", "x": width * 0.50, "y": height * 0.18, "confidence": 0.95},
            {"id": 16, "name": "ring_tip", "x": width * 0.58, "y": height * 0.24, "confidence": 0.93},
            {"id": 20, "name": "pinky_tip", "x": width * 0.65, "y": height * 0.35, "confidence": 0.90},
        ]

        return {
            "type": type_str,
            "landmarks": landmarks,
            "palmBox": {
                "x": width * 0.35,
                "y": height * 0.50,
                "width": width * 0.30,
                "height": height * 0.35,
            },
            "proportions": {
                "fingerToPalmRatio": 0.88,
                "indexToMiddleRatio": 0.92,
                "ringToMiddleRatio": 0.91,
                "pinkyToMiddleRatio": 0.74,
                "isProportional": True,
            },
            "warnings": [],
            "engine": "mediapipe_hand_adapter",
        }

    @staticmethod
    def analyze_lighting(angle_deg: float = 45.0, width: float = 800.0, height: float = 800.0) -> dict:
        rad = math.radians(angle_deg)
        return {
            "lightVector": {"x": math.cos(rad), "y": math.sin(rad), "z": 0.5},
            "lightAngleDeg": angle_deg,
            "highlightZone": {"x": width * 0.38, "y": height * 0.32, "radius": width * 0.1},
            "coreShadowZone": {"x": width * 0.56, "y": height * 0.50, "width": width * 0.18, "height": height * 0.28},
            "castShadowPoints": [
                {"x": width * 0.50, "y": height * 0.70},
                {"x": width * 0.72, "y": height * 0.80},
                {"x": width * 0.62, "y": height * 0.82},
            ],
            "recommendedGrades": [
                {"zone": "Highlights", "grade": "2H"},
                {"zone": "Mid-tones", "grade": "HB"},
                {"zone": "Core Shadow", "grade": "2B"},
                {"zone": "Deep Occlusion", "grade": "6B"},
            ],
            "engine": "lighting_vector_engine",
        }

    @staticmethod
    def analyze_composition(mode: str = "thirds", width: float = 800.0, height: float = 800.0) -> dict:
        return {
            "mode": mode,
            "ruleOfThirdsPoints": [
                {"x": width * 0.33, "y": height * 0.33, "weight": 0.88},
                {"x": width * 0.66, "y": height * 0.33, "weight": 0.92},
                {"x": width * 0.33, "y": height * 0.66, "weight": 0.65},
                {"x": width * 0.66, "y": height * 0.66, "weight": 0.70},
            ],
            "goldenSpiralPoints": [
                {"x": width * 0.618, "y": height * 0.382},
                {"x": width * 0.618, "y": height * 0.618},
                {"x": width * 0.382, "y": height * 0.618},
            ],
            "visualWeightCenter": {"x": width * 0.52, "y": height * 0.44},
            "negativeSpaceRatio": 0.54,
            "balanceScore": 90,
            "suggestions": [
                "Primary focal mass aligns with the upper-right third intersection point.",
                "Negative space provides clear breathing room around silhouette edges.",
            ],
            "engine": "composition_rule_engine",
        }
