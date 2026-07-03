from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Any, Optional
from utility.prompts import ROAST_MODES, ANALYSIS_MODES
from pydantic import BaseModel, Field, field_validator
from typing import Optional

VALID_MODES = list(ROAST_MODES.keys()) + list(ANALYSIS_MODES.keys())


class RoastRequestSchema(BaseModel):
    code: str = Field(..., min_length=10, max_length=10000, description="Code to roast")
    mode: str = Field(default="senior_dev", description="Roast mode")
    language: Optional[str] = Field(
        default="python", description="Programming language"
    )

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value):
        if value.lower() not in VALID_MODES:
            raise ValueError(f"Invalid mode. Choose from: {VALID_MODES}")
        return value.lower()

    @field_validator("code")
    @classmethod
    def validate_code(cls, value):
        if not value.strip():
            raise ValueError("code cannot be empty or whitespace only")
        return value.strip()


class CodeAnalysisRequestSchema(BaseModel):
    code: str = Field(
        ...,
        min_length=10,
        max_length=8000,
    )

    language: Optional[str] = Field(
        default="python",
        description="Programming language of the code",
    )

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str):
        if not value or not value.strip():
            raise ValueError("code cannot be empty or whitespace only")
        return value.strip()

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: Optional[str]):
        return (value or "python").lower().strip()


def API_RESPONSE(
    *,
    success: bool = True,
    status_code: int = 200,
    message: str = "SUCCESS",
    data: Any = None,
    error: Optional[str] = None,
    error_code: Optional[str] = None,
    model_used: Optional[str] = None,
    tokens_used: Optional[int] = None,
    route: Optional[str] = None,
) -> JSONResponse:

    body = {
        "success": success,
        "status_code": status_code,
        "message": message,
        "data": data,
        "error": (
            {
                "detail": error,
                "error_code": error_code,
            }
            if not success
            else None
        ),
        "meta": {
            "model": model_used or "llama3-8b-8192",
            "tokens": tokens_used or None,
            "route": route or None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "api": "RoastMyCode",
            "version": "1.0.0",
        },
    }

    return JSONResponse(status_code=status_code, content=body)
