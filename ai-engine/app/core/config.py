from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "*"
    LOG_LEVEL: str = "info"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    @property
    def cors_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
