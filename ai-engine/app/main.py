from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.routes import router as api_v1_router

app = FastAPI(
    title="ARTISTRY AI — Computer Vision & AI Engine",
    description="Dedicated OpenCV, MediaPipe and Multimodal AI service for ARTISTRY AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Primary v1 router
app.include_router(api_v1_router, prefix="/api/v1")

# Direct aliases for internal Node.js RPC and backwards compatibility
app.include_router(api_v1_router, prefix="")


@app.get("/")
def root():
    return {
        "service": "ARTISTRY AI Engine",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0",
    }
