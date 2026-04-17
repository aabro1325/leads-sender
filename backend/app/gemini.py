from __future__ import annotations

import json
from typing import Any, Iterator

from google import genai
from google.genai import types

from .config import settings

_client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

MODEL = "gemma-4-31b-it"


def _require():
    if _client is None:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return _client


def generate_json(prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
    client = _require()
    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.2,
        ),
    )
    return json.loads(resp.text)


def generate_json_stream(prompt: str, schema: dict[str, Any]) -> Iterator[str]:
    """Yields incremental text chunks; caller should accumulate + json.loads at end."""
    client = _require()
    stream = client.models.generate_content_stream(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.4,
        ),
    )
    for chunk in stream:
        if chunk.text:
            yield chunk.text
