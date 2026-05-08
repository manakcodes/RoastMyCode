from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from utility.prompts import ROAST_MODES, ANALYSIS_MODES
from routers.health import HEALTH_ROUTER
from routers.test import TEST_ROUTER
from routers.roast import ROAST_ROUTER
from routers.analysis import ANALYSIS_ROUTER

app = FastAPI(
    title="RoastMyCode",
    description="Heuristic diagnostics via persona-driven agents for critical-path logic systems.",
    version="1.0.0",
)


@app.get("/", status_code=status.HTTP_200_OK)
async def index():
    return JSONResponse(
        status_code=200,
        content={
            "app": "roastmycode",
            "tagline": "Heuristic diagnostics via persona-driven agents for critical-path logic systems.",
            "version": "1.0.0",
            "author": "manak",
            "status": "RUNNING",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "description": (
                "RoastMyCode is a multi-engine AI system that evaluates code through "
                "layers: emotional roasting (personas), statistical and complexity analysis. "
            ),
            "systems": [
                {
                    "name": "Roast Engine",
                    "type": "qualitative AI judgment",
                    "description": "Persona-based code roasting using AI personalities",
                    "endpoint": "/roast",
                    "modes_count": len(ROAST_MODES),
                    "available_modes": list(ROAST_MODES.keys()),
                },
                {
                    "name": "Analysis Engine",
                    "type": "quantitative evaluation system",
                    "description": "Statistical scoring of architecture, readability, maintainability, and risk",
                    "endpoint": "/analysis/metrics",
                    "modes_count": len(ANALYSIS_MODES),
                    "available_modes": list(ANALYSIS_MODES.keys()),
                },
            ],
            "capabilities": [
                "AI-powered code roasting with personalities",
                "Static code quality scoring (0.0 - 1.0 metrics)",
                "Big-O time and space complexity prediction",
                "Production risk estimation",
                "Bug probability analysis",
                "Code explanation and auto-fixing",
            ],
            "available_modes": {
                "roast_modes": list(ROAST_MODES.keys()),
                "analysis_modes": list(ANALYSIS_MODES.keys()),
            },
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
            "warning": {
                "message": "This API will analyze and judge your code rigorously.",
                "note": "Roast outputs are intentionally opinionated and persona-driven.",
                "serious_note": "Analysis and complexity outputs are mathematically grounded.",
            },
            "links": {
                "docs": "/docs",
                "redoc": "/redoc",
                "health": "/health/status",
                "github": "https://github.com/manakcodes/roastmycode",
            },
            "experience": {
                "tone": "developer-first, slightly sarcastic, technically serious",
                "philosophy": "good code should survive both emotional judgment and mathematical analysis",
            },
        },
    )


ALL_API_ROUTERS = [HEALTH_ROUTER, TEST_ROUTER, ROAST_ROUTER, ANALYSIS_ROUTER]

for api_router in ALL_API_ROUTERS:
    app.include_router(router=api_router)


def main():
    print("Hello from roast-my-code!")
