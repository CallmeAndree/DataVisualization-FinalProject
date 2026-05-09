from __future__ import annotations

import asyncio
import base64
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import pandas as pd

_UTF8_BOILERPLATE = """\
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
"""


def _inject_utf8(code: str) -> str:
    """Đảm bảo UTF-8 boilerplate luôn ở đầu code, tránh UnicodeEncodeError khi in tiếng Việt."""
    if "sys.stdout = io.TextIOWrapper" in code:
        return code  # model đã tự thêm, không duplicate
    return _UTF8_BOILERPLATE + code



DATA_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_FILES = ("videos_processed.csv", "channels_processed.csv")


def _find_dataset_source(name: str) -> Path | None:
    for folder in (DATA_DIR / "sandbox", DATA_DIR / "data"):
        candidate = folder / name
        if candidate.exists():
            return candidate
    return None


def _ensure_datasets(sandbox_dir: Path) -> None:
    for name in DATASET_FILES:
        dst = sandbox_dir / name
        src = _find_dataset_source(name)
        if src and not dst.exists():
            shutil.copy2(src, dst)
        if dst.exists():
            _ensure_column_aliases(dst)


def _cleanup_run_script(script: Path) -> None:
    try:
        script.unlink(missing_ok=True)
    except OSError:
        pass


def _ensure_column_aliases(path: Path) -> None:
    try:
        df = pd.read_csv(path)
    except Exception:
        return

    updated = False
    if path.name == "channels_processed.csv":
        if "category" not in df.columns and "channel_category" in df.columns:
            df["category"] = df["channel_category"]
            updated = True
    elif path.name == "videos_processed.csv":
        if "video_category" not in df.columns and "channel_category" in df.columns:
            df["video_category"] = df["channel_category"]
            updated = True

    if updated:
        df.to_csv(path, index=False)


def _build_run_script(code: str) -> str:
    return f"""import os
os.environ[\"MPLBACKEND\"] = \"Agg\"
import atexit


def _save_open_figures():
    try:
        import matplotlib
        matplotlib.use(\"Agg\")
        import matplotlib.pyplot as plt

        figs = sorted(plt.get_fignums())
        for idx, num in enumerate(figs, start=1):
            fig = plt.figure(num)
            fig.savefig(f\"figure_{{idx}}.png\", bbox_inches=\"tight\")

    except Exception:
        pass

atexit.register(_save_open_figures)


code = {code!r}
exec(compile(code, __file__, \"exec\"), globals())
"""


def _capture_figures(sandbox_dir: Path) -> list[str]:
    figures: list[str] = []
    for png in sorted(sandbox_dir.glob("*.png")):
        try:
            data = png.read_bytes()
            encoded = base64.b64encode(data).decode("ascii")
            figures.append(f"data:image/png;base64,{encoded}")
        finally:
            try:
                png.unlink(missing_ok=True)
            except OSError:
                pass
    return figures


def _run_code_sync(code: str, sandbox_dir: Path, timeout: int) -> dict[str, Any]:
    """Sync version of run_code for Windows compatibility"""
    sandbox_dir = Path(sandbox_dir).resolve()
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    _ensure_datasets(sandbox_dir)
    script = sandbox_dir / "run.py"
    script.write_text(_build_run_script(_inject_utf8(code)), encoding="utf-8")

    started = time.perf_counter()
    try:
        creationflags = (
            subprocess.CREATE_NEW_PROCESS_GROUP
            if os.name == "nt"
            else 0
        )
        proc = subprocess.run(
            [sys.executable, "run.py"],
            cwd=str(sandbox_dir),
            stdin=subprocess.DEVNULL,
            capture_output=True,
            timeout=timeout,
            creationflags=creationflags,
            start_new_session=(os.name != "nt"),
        )
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")
        elapsed = int((time.perf_counter() - started) * 1000)
        figures = _capture_figures(sandbox_dir)
        _cleanup_run_script(script)

        if proc.returncode == 0:
            return {
                "status": "completed",
                "stdout": stdout,
                "stderr": stderr,
                "figures": figures,
                "execution_time_ms": elapsed,
                "error_message": None,
            }
        return {
            "status": "failed",
            "stdout": stdout,
            "stderr": stderr,
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": stderr.strip().splitlines()[-1] if stderr.strip() else "Lỗi thực thi không rõ",
        }
    except subprocess.TimeoutExpired:
        elapsed = int((time.perf_counter() - started) * 1000)
        figures = _capture_figures(sandbox_dir)
        _cleanup_run_script(script)
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": f"Vượt quá thời gian thực thi {timeout}s",
        }
    except KeyboardInterrupt:
        elapsed = int((time.perf_counter() - started) * 1000)
        figures = _capture_figures(sandbox_dir)
        _cleanup_run_script(script)
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": "Thực thi bị hủy (KeyboardInterrupt)",
        }
    except Exception as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        figures = _capture_figures(sandbox_dir)
        _cleanup_run_script(script)
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": str(exc) or "Lỗi thực thi không rõ",
        }


async def run_code(code: str, sandbox_dir: Path, timeout: int = 30) -> dict[str, Any]:
    """Async wrapper around sync subprocess for Windows compatibility"""
    try:
        return await asyncio.to_thread(_run_code_sync, code, sandbox_dir, timeout)
    except KeyboardInterrupt:
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": [],
            "execution_time_ms": 0,
            "error_message": "Thực thi bị hủy (KeyboardInterrupt)",
        }
    except Exception as exc:
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": [],
            "execution_time_ms": 0,
            "error_message": str(exc) or "Lỗi thực thi không rõ",
        }