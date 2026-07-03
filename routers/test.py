from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

TEST_ROUTER = APIRouter(prefix="/test", tags=["TEST"])


@TEST_ROUTER.get("/", status_code=status.HTTP_200_OK)
async def test():
    return JSONResponse(
        status_code=200,
        content={
            "description": "Reference for both response structures from RoastMyCode",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "success_response": {
                "success": True,
                "status_code": 200,
                "message": "SUCCESS",
                "data": {
                    "roast": "The provided code has a time complexity of O(n^2) due to the nested loops, which can be inefficient for large inputs. The variable names are not very descriptive, and the function does not handle edge cases such as empty arrays.",
                    "score": 60,
                    "score_label": "Marginal",
                    "grade": "D+",
                    "issues": [
                        "Inefficient algorithm",
                        "Poor variable naming",
                        "Lack of input validation",
                    ],
                    "positive": [
                        "The code is simple and easy to understand",
                        "It produces the correct output for the given example",
                    ],
                },
                "error": None,
                "meta": {
                    "model": "llama-3.3-70b-versatile",
                    "tokens": None,
                    "route": "/roast/dijkstra",
                    "timestamp": "2026-05-06T09:51:16.781068+00:00",
                    "api": "RoastMyCode",
                    "version": "1.0.0",
                },
            },
            "failure_response": {
                "description": "Returned when input is invalid or LLM call fails",
                "possible_causes": [
                    "code field is empty or missing",
                    "intensity level not in supported list",
                    "language not in supported list",
                    "code exceeds maximum token limit",
                    "Groq rate limit hit",
                    "LLM returned malformed JSON",
                ],
                "structure": {
                    "success": "bool — always False on failure",
                    "status_code": "int — 400, 422, 429, or 500",
                    "message": "str — what went wrong",
                    "data": "null — always null on failure",
                    "error": {
                        "detail": "str — detailed error description",
                        "error_code": "str — machine readable error code",
                    },
                    "meta": {
                        "model": "str — model attempted",
                        "tokens": "null — no tokens used on failure",
                        "route": "str — endpoint that was hit",
                        "timestamp": "str — ISO 8601 UTC timestamp",
                        "api": "str — RoastMyCode",
                        "version": "str — API version",
                    },
                },
                "example": {
                    "success": False,
                    "status_code": 422,
                    "message": "INVALID INTENSITY LEVEL",
                    "data": None,
                    "error": {
                        "detail": "Intensity level 'savage' is not supported",
                        "error_code": "INVALID_INTENSITY",
                    },
                    "meta": {
                        "model": "llama3-8b-8192",
                        "tokens": None,
                        "route": "/roast",
                        "timestamp": "2026-03-01T10:32:11.000Z",
                        "api": "RoastMyCode",
                        "version": "1.0.0",
                    },
                },
            },
            "error_codes": {
                "EMPTY_CODE": "code field is empty or whitespace only",
                "INVALID_INTENSITY": "intensity level not in supported list",
                "INVALID_LANGUAGE": "language not in supported list",
                "CODE_TOO_LONG": "code exceeds 10000 character limit",
                "LLM_RATE_LIMIT": "Groq rate limit hit — try again shortly",
                "LLM_PARSE_ERROR": "LLM returned malformed response",
                "LLM_UNAVAILABLE": "Groq service temporarily unavailable",
            },
            "notes": [
                "data is always null on failure",
                "error is always null on success",
                "meta.tokens shows Groq token consumption per request",
                "all timestamps are ISO 8601 UTC",
                "status_code in body always mirrors HTTP status code",
            ],
        },
    )


""" ===================================================================================== """
""" TEST CASE """
""" ===================================================================================== """


"""
{
  "code": "def process_data(arr):\n    total = 0\n    for i in range(len(arr)):\n        for j in range(i):\n            total += arr[j] * arr[i]\n    return total\n\nprint(process_data([1, 2, 3, 4]))",
  "language": "python",
  "mode": "djkistra"
}
"""
