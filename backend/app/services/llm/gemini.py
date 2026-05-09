from __future__ import annotations

import json
import re
from typing import Any

import google.generativeai as genai

from app.services.llm.base import LLMClient
from app.services.llm.prompts import build_system_prompt, schema_dict_to_text

_PLACEHOLDER_KEYS = {"", "your-key-here", "changeme", "placeholder"}
_FENCE_RE = re.compile(r"```(?:json|JSON)?\s*(.*?)\s*```", re.DOTALL)


def _coerce_generation_payload(data: Any) -> dict[str, str] | None:
    if not isinstance(data, dict) or "code" not in data:
        return None
    return {
        "code": str(data.get("code") or ""),
        "explanation": str(data.get("explanation") or ""),
    }


def _json_candidates(text: str) -> list[str]:
    cleaned = text.strip()
    candidates: list[str] = []

    for match in _FENCE_RE.finditer(cleaned):
        fenced = match.group(1).strip()
        if fenced:
            candidates.append(fenced)

    if cleaned:
        candidates.append(cleaned)

    decoder = json.JSONDecoder()
    for start, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            _, end = decoder.raw_decode(cleaned[start:])
        except json.JSONDecodeError:
            continue
        candidates.append(cleaned[start : start + end])

    return candidates


def _extract_generation_payload(text: str) -> dict[str, str]:
    for candidate in _json_candidates(text):
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        payload = _coerce_generation_payload(parsed)
        if payload is not None:
            return payload

    return {
        "code": "",
        "explanation": f"Lỗi parse response từ Gemini: {text.strip()[:200]!r}",
    }


def _parse_response(text: str) -> dict[str, str]:
    return _extract_generation_payload(text)


class GeminiClient(LLMClient):
    def __init__(self, api_key: str = "", model_name: str = "gemini-3.1-flash-lite-preview") -> None:
        self.api_key = api_key
        self.model_name = model_name
        self._configured = False
        self._model: Any | None = None

    def _ensure_configured(self) -> None:
        if self._configured:
            return
        if not self.api_key or self.api_key.strip() in _PLACEHOLDER_KEYS:
            raise RuntimeError("GEMINI_API_KEY chưa cấu hình")
        genai.configure(api_key=self.api_key)
        self._model = genai.GenerativeModel(self.model_name)
        self._configured = True

    async def generate(
        self,
        prompt: str,
        data_context: dict[str, Any] | None,
        history: list[dict] | None = None,
    ) -> dict:
        self._ensure_configured()
        assert self._model is not None

        if data_context:
            video_text, channel_text = schema_dict_to_text(data_context)
        else:
            video_text, channel_text = ("# videos: <chưa có schema>", "# channels: <chưa có schema>")
        system_prompt = build_system_prompt(video_text, channel_text)
        full_prompt = f"{system_prompt}\n\n## YÊU CẦU TỪ NGƯỜI DÙNG:\n{prompt}"

        try:
            response = await self._model.generate_content_async(full_prompt)
        except Exception as e:
            return {
                "code": "",
                "explanation": f"Lỗi gọi Gemini API: {type(e).__name__}: {str(e)[:300]}",
            }
        text = getattr(response, "text", "") or ""
        return _parse_response(text)

    async def generate_stream(
        self,
        prompt: str,
        data_context: dict[str, Any] | None,
        history: list[dict] | None = None,
    ):
        """
        Stream AI-generated code using Gemini's streaming API.
        Yields SSE-formatted JSON chunks: {"code": "...", "explanation": "..."}
        """
        self._ensure_configured()
        assert self._model is not None

        if data_context:
            video_text, channel_text = schema_dict_to_text(data_context)
        else:
            video_text, channel_text = ("# videos: <chưa có schema>", "# channels: <chưa có schema>")
        system_prompt = build_system_prompt(video_text, channel_text)
        full_prompt = f"{system_prompt}\n\n## YÊU CẦU TỪ NGƯỜI DÙNG:\n{prompt}"

        try:
            # Use Gemini's streaming API
            response = await self._model.generate_content_async(
                full_prompt,
                stream=True,
            )

            accumulated_text = ""
            async for chunk in response:
                chunk_text = getattr(chunk, "text", "") or ""
                if chunk_text:
                    accumulated_text += chunk_text

            final_parsed = _parse_response(accumulated_text)
            yield json.dumps(final_parsed, ensure_ascii=False)

        except Exception as e:
            # Yield error as JSON
            error_response = {
                "code": "",
                "explanation": f"Lỗi gọi Gemini API: {type(e).__name__}: {str(e)[:300]}",
            }
            yield json.dumps(error_response, ensure_ascii=False)

