import json
import re
from dotenv import load_dotenv
import os
from groq import Groq
from .prompts import (
    ROAST_MODES,
    FIX_CODE_PROMPT,
    EXPLAIN_CODE_ISSUES_PROMPT,
    ANALYSIS_MODES,
)

load_dotenv()

GROQ_API_KEY_FROM_ENV = os.environ.get("GROQ_API_KEY")
MODEL_FROM_ENV = os.environ.get("MODEL")


def parse_llm_response(raw: str) -> dict:

    cleaned = re.sub(r"```json|```", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


client = Groq(api_key=GROQ_API_KEY_FROM_ENV)


def get_llm_response(
    user_code_content: str,
    code_language: str,
    mode_key: str | None = None,
    *,
    fix_code_prompt: bool = False,
    explain_code_prompt: bool = False,
):

    mode_key = (mode_key or "").lower().strip()
    persona = ROAST_MODES.get(mode_key) or ANALYSIS_MODES.get(mode_key)

    if not persona:
        return {
            "error": "invalid roast mode selected",
            "received_mode": mode_key,
            "available_roast_modes": list(ROAST_MODES.keys()),
            "available_analysis_modes": list(ANALYSIS_MODES.keys()),
        }
    base_keys = "roast, score, score_label, grade, issues, positive"

    try:

        if fix_code_prompt:
            allowed_keys = base_keys + ", fixed"
            llm_prompt = (
                persona["prompt"].replace(base_keys, allowed_keys) + FIX_CODE_PROMPT
            )

        elif explain_code_prompt:
            allowed_keys = base_keys + ", fixed"
            llm_prompt = (
                persona["prompt"].replace(base_keys, allowed_keys)
                + EXPLAIN_CODE_ISSUES_PROMPT
            )

        else:
            llm_prompt = persona["prompt"]

        chat_completion = client.chat.completions.create(
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": llm_prompt},
                {
                    "role": "user",
                    "content": f"Language: {code_language}, Review this code and provide your roast:\n\n{user_code_content}",
                },
            ],
            model=MODEL_FROM_ENV,
            temperature=0.8,
        )

        raw = chat_completion.choices[0].message.content
        parsed = parse_llm_response(raw)

        if parsed is None:
            return {"error": "INVALID JSON from LLM", "raw": raw}

        return parsed

    except Exception as e:
        return {"ERROR": str(e)}


my_bad_code = """
def calc(a, b):
    res = a + b
    goto = "none"
    for i in range(10):
        print("doing nothing")
    return res
"""
