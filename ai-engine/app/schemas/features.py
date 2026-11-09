from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


# 1. Sketch Converter
class SketchConvertOptions(BaseModel):
    style: str = "graphite"
    intensity: float = 50.0
    contrast: float = 50.0
    brightness: float = 50.0
    detailLevel: float = 50.0
    edgeStrength: float = 50.0
    grayscale: bool = True
    paperTexture: bool = False


class SketchConvertRequest(BaseModel):
    imageUri: str
    options: SketchConvertOptions = Field(default_factory=SketchConvertOptions)


# 2. Drawing Analyzer
class DrawingAnalysisRequest(BaseModel):
    width: float = 800.0
    height: float = 800.0
    drawingUri: Optional[str] = None
    referenceUri: Optional[str] = None


# 3. Reference Generator
class ReferenceGenerateRequest(BaseModel):
    category: str = "portraits"
    customPrompt: Optional[str] = None
    style: str = "realistic"
    complexity: str = "intermediate"
    aspectRatio: str = "1:1"


# 4. Pose Coach
class PoseDetectionRequest(BaseModel):
    imageUri: Optional[str] = None
    width: float = 800.0
    height: float = 800.0


# 5. Hand / Foot
class HandFootDetectionRequest(BaseModel):
    type: str = "hand"
    imageUri: Optional[str] = None
    width: float = 800.0
    height: float = 800.0


# 6. Lighting Predictor
class LightingAnalysisRequest(BaseModel):
    imageUri: Optional[str] = None
    lightAngleDeg: float = 45.0
    width: float = 800.0
    height: float = 800.0


# 7. Composition Coach
class CompositionAnalysisRequest(BaseModel):
    imageUri: Optional[str] = None
    mode: str = "thirds"
    width: float = 800.0
    height: float = 800.0


# 8. Line Art Cleaner
class LineArtCleanOptions(BaseModel):
    binarizeThreshold: int = 128
    removeScannerGrain: bool = True
    enhanceContrast: bool = True
    smoothContours: bool = True


class LineArtCleanRequest(BaseModel):
    imageUri: str
    options: LineArtCleanOptions = Field(default_factory=LineArtCleanOptions)


# 9. Smart Segmentation
class SegmentationRequest(BaseModel):
    imageUri: str
    tolerance: float = 25.0
    feathering: float = 3.0


# 10. Color Recommendation
class ColorRecommendRequest(BaseModel):
    imageUri: Optional[str] = None
    harmonyType: str = "complementary"
    count: int = 5


# 11. Multi-Angle Turnaround
class MultiAngleGenerateRequest(BaseModel):
    subjectUri: Optional[str] = None
    prompt: str = "Character model"
    characterStyle: str = "mannequin"
    includeHeightGuides: bool = True


# 12. Mistake Detector
class MistakeDetectRequest(BaseModel):
    drawingUri: Optional[str] = None
    subjectType: str = "portrait"


# 13. Art Mentor
class MentorMessage(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: Optional[float] = None


class ArtMentorRequest(BaseModel):
    messages: List[MentorMessage]
    experienceMode: str = "beginner"
    topic: Optional[str] = None


# 14. Vectorizer
class VectorizeOptions(BaseModel):
    pathTolerance: float = 2.5
    curveSmoothness: float = 1.0
    cornerThreshold: float = 45.0
    exportSvgXml: bool = True


class VectorizeRequest(BaseModel):
    imageUri: str
    options: VectorizeOptions = Field(default_factory=VectorizeOptions)
