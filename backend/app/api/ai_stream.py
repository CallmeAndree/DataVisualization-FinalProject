"""
SSE streaming endpoint for AI code generation.
Streams code chunks progressively to provide real-time feedback.
"""
import json
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services.llm.gemini import GeminiClient
from ..services.logger import insert_request, update_request_status
from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["ai-stream"])


class GenerateStreamRequest(BaseModel):
    prompt: str
    data_context: dict | None = None


@router.post("/generate-stream")
async def generate_stream(req: GenerateStreamRequest):
    """
    Stream AI-generated code using Server-Sent Events (SSE).

    Returns SSE stream with:
    - data: {code: string, explanation: string} chunks
    - event: done when complete
    - event: error on failure
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt không được để trống")

    # Generate request ID
    request_id = str(uuid.uuid4())

    async def event_generator():
        try:
            # Initialize Gemini client
            client = GeminiClient(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)

            # Accumulate final authoritative response for logging.
            full_code = ""
            full_explanation = ""

            # Stream code generation. GeminiClient emits the final parsed payload.
            async for chunk in client.generate_stream(
                prompt=req.prompt,
                data_context=req.data_context or {},
            ):
                try:
                    parsed = json.loads(chunk)
                except json.JSONDecodeError:
                    continue

                full_code = parsed.get("code", full_code) or full_code
                full_explanation = parsed.get("explanation", full_explanation) or full_explanation

                if not full_code.strip():
                    error_msg = full_explanation or "Không thể sinh code từ Gemini"
                    yield f"event: error\ndata: {json.dumps({'error': error_msg}, ensure_ascii=False)}\n\n"
                    return

                # Send authoritative final SSE data event before done.
                yield f"data: {json.dumps({'code': full_code, 'explanation': full_explanation}, ensure_ascii=False)}\n\n"

            if not full_code.strip():
                yield f"event: error\ndata: {json.dumps({'error': 'Gemini không trả về code hợp lệ'}, ensure_ascii=False)}\n\n"
                return

            # Log the completed request with the same code emitted to the client.
            await insert_request(
                request_id=request_id,
                user_prompt=req.prompt,
                data_context=req.data_context,
                ai_code=full_code,
                ai_explanation=full_explanation,
            )

            # Send done event with valid JSON
            yield f"event: done\ndata: {json.dumps({'request_id': request_id}, ensure_ascii=False)}\n\n"

        except Exception as e:
            # Send error event with valid JSON
            error_msg = str(e)
            yield f"event: error\ndata: {json.dumps({'error': error_msg}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
