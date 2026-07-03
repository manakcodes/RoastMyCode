from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/ui", response_class=HTMLResponse)
async def serve_frontend(request: Request):
    roast_modes = [
        {
            "key": mode_key,
            "name": item.get("name", mode_key.replace("_", " ").title()),
            "tagline": item["tagline"],
            "group": "Persona",
        }
        for mode_key, item in ROAST_MODES.items()
    ]
    analysis_modes = [
        {
            "key": mode_key,
            "name": item.get("name", item["key"].replace("_", " ").title()),
            "tagline": item["tagline"],
            "group": "Analysis",
        }
        for mode_key, item in ANALYSIS_MODES.items()
    ]

    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "app_name": "RoastMyCode",
            "tagline": "AI code review for correctness, clarity, and production risk.",
            "modes": roast_modes + analysis_modes,
            "default_mode": "dijkstra",
            "routes": {
                "roast": "/roast/personality/",
                "fix": "/roast/fix/",
                "explain": "/roast/explain/",
                "analysis": "/analysis/metrics/",
            },
        },
    )


@app.get("/", status_code=status.HTTP_200_OK)
async def index():
    return JSONResponse(
        status_code=200,
        content={
            "app": "RoastMyCode",
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


# def main():
#     print("Hello from roast-my-code!")
