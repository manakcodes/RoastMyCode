from fastapi import APIRouter, Body, status
from schemas import api_schema
from utility.groq_utility import get_llm_response
from utility.prompts import ANALYSIS_MODES
import os

ANALYSIS_ROUTER = APIRouter(prefix="/analysis", tags=["ANALYSIS"])


@ANALYSIS_ROUTER.get("/modes/", status_code=status.HTTP_200_OK)
async def get_analysis_modes():

    keys = list(ANALYSIS_MODES.values())
    data = [{"key": item["key"], "tagline": item["tagline"]} for item in keys]

    return api_schema.API_RESPONSE(
        success=True,
        status_code=status.HTTP_200_OK,
        data=data,
        error=None,
        model_used=None,
    )


@ANALYSIS_ROUTER.post("/metrics/")
async def get_analyzed(RoastRequestObject: api_schema.RoastRequestSchema = Body()):
    RequestDict = dict(RoastRequestObject.model_dump())
    llm_response = get_llm_response(
        user_code_content=RequestDict["code"],
        mode_key=RequestDict["mode"],
        code_language=RequestDict["language"],
    )

    if "error" in llm_response:
        return api_schema.API_RESPONSE(
            success=False,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="LLM CALL FAILED",
            error=llm_response["error"],
            error_code="LLM_ERROR",
            route=f"/roast/{RequestDict['mode']}",
        )

    return api_schema.API_RESPONSE(
        success=True,
        status_code=status.HTTP_200_OK,
        message="SUCCESS",
        data=llm_response,
        model_used=os.environ.get("MODEL"),
        route=f"/roast/{RequestDict['mode']}",
    )
