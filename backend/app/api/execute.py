from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.request import ExecuteRequest
from app.models.response import ExecuteResponse
from app.services import executor
from app.services.logger import (
    get_request,
    update_request_edit,
    update_request_execution,
    update_request_status,
)

router = APIRouter()


@router.post("", response_model=ExecuteResponse)
async def execute(payload: ExecuteRequest) -> ExecuteResponse:
    row = await get_request(payload.request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy request_id")

    ai_code = row.get("ai_code") or ""
    request_code = _normalize_code(payload.code)
    stored_code = _normalize_code(ai_code)
    was_edited = request_code != stored_code and request_code != _normalize_code_json_escaped(ai_code)
    if was_edited:
        await update_request_edit(payload.request_id, payload.code, True)

    await update_request_status(payload.request_id, "executing")

    try:
        result = await executor.run_code(
            payload.code, settings.SANDBOX_DIR, timeout=30
        )
    except Exception as exc:
        result = {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": [],
            "execution_time_ms": 0,
            "error_message": str(exc) or "Lỗi thực thi không rõ",
        }

    await update_request_execution(payload.request_id, result)

    return ExecuteResponse(
        request_id=payload.request_id,
        status=result["status"],
        stdout=result.get("stdout", ""),
        stderr=result.get("stderr", ""),
        figures=result.get("figures", []),
        execution_time_ms=result.get("execution_time_ms", 0),
        error_message=result.get("error_message"),
    )


def _normalize_code(code: str) -> str:
    """Normalize transport-only differences before edit detection."""
    return code.replace("\r\n", "\n").replace("\r", "\n").strip()


def _normalize_code_json_escaped(code: str) -> str:
    """Normalize code after clients accidentally send JSON-escaped newlines."""
    return _normalize_code(code.replace("\\n", "\n").replace("\\r", "\r"))
