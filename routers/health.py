from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import sys
import platform
import os

HEALTH_ROUTER = APIRouter(prefix="/health", tags=["HEALTH"])


@HEALTH_ROUTER.get("/", status_code=status.HTTP_200_OK)
async def index():
    return JSONResponse(
        status_code=200,
        content={
            "api": "RoastMyCode",
            "tagline": "Heuristic diagnostics via persona-driven agents for critical-path logic systems.",
            "version": "1.0.0",
            "author": "manak",
            "github": "https://github.com/manakcodes/roastmycode",
            "status": "RUNNING",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "routes": {
                "index": ["/"],
                "/health/": [
                    "/",
                    "/status/",
                    "/ping/",
                ],
                "/test/": ["/"],
                "/roast/": ["/roast/modes/", "/roast/personality", "/roast/fix"],
                "/analysis/": ["/analysis/modes", "/analysis/metrics"],
            },
            "quick_links": {
                "ping": "/health/ping",
                "status": "/health/status",
                "test": "/health/test",
                "docs": "/docs",
                "redoc": "/redoc",
            },
        },
    )


@HEALTH_ROUTER.get("/status", status_code=status.HTTP_200_OK)
async def health_status():
    return JSONResponse(
        status_code=200,
        content={
            "status": "OK",
            "state": "HEALTHY",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system": {
                "python": sys.version.split(" ")[0],
                "platform": platform.system(),
                "machine": platform.machine(),
                "os": platform.platform(),
            },
            "app": {
                "name": "RoastMyCode",
                "version": "1.0.0",
                "tagline": "Your code reviewer has no chill.",
                "author": "manak",
                "github": "https://github.com/manakcodes/roastmycode",
            },
            "llm": {
                "provider": "Groq",
                "model": os.environ.get("MODEL"),
                "status": "connected",
                "speed": "~200 tokens/sec",
            },
        },
    )


@HEALTH_ROUTER.get("/ping", status_code=status.HTTP_200_OK)
async def ping():
    return JSONResponse(
        status_code=200,
        content={
            "ping": "pong",
            "status": "OK",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


#
