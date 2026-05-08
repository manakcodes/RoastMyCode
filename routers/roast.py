from fastapi import APIRouter, Body, status
from schemas import api_schema
from utility.groq_utility import get_llm_response
from utility.prompts import ROAST_MODES
import os

ROAST_ROUTER = APIRouter(prefix="/roast", tags=["ROAST"])


@ROAST_ROUTER.get("/modes/", status_code=status.HTTP_200_OK)
async def get_roast_modes():

    keys = list(ROAST_MODES.values())
    data = [{"key": item["key"], "tagline": item["tagline"]} for item in keys]

    return api_schema.API_RESPONSE(
        success=True,
        status_code=status.HTTP_200_OK,
        data=data,
        error=None,
        model_used=None,
    )


@ROAST_ROUTER.post("/personality/")
async def get_roasted(RoastRequestObject: api_schema.RoastRequestSchema = Body()):
    RequestDict = dict(RoastRequestObject.model_dump())
    llm_response = get_llm_response(
        user_code_content=RequestDict["code"],
        mode_key=RequestDict["mode"],
        fix_code_prompt=False,
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


@ROAST_ROUTER.post("/fix/")
async def get_roast_with_fix(
    RoastRequestObject: api_schema.RoastRequestSchema = Body(),
):
    RequestDict = dict(RoastRequestObject.model_dump())

    llm_response = get_llm_response(
        user_code_content=RequestDict["code"],
        mode_key=RequestDict["mode"],
        fix_code_prompt=True,
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


@ROAST_ROUTER.post("/explain/")
async def get_roast_with_explanation(
    RoastRequestObject: api_schema.RoastRequestSchema = Body(),
):
    RequestDict = dict(RoastRequestObject.model_dump())

    llm_response = get_llm_response(
        user_code_content=RequestDict["code"],
        mode_key=RequestDict["mode"],
        explain_code_prompt=True,
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
