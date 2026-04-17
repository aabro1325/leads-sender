from __future__ import annotations

import hashlib
from pathlib import Path

import redis

from .celery_app import celery_app
from .config import settings
from .pipeline import enqueue_lead

_r = redis.Redis.from_url(settings.redis_url, decode_responses=True)
PROCESSED_KEY = "scanner:processed"  # set of "<path>:<sha1>"


def _fingerprint(path: Path, content: str) -> str:
    h = hashlib.sha1(content.encode("utf-8")).hexdigest()
    return f"{path}:{h}"


@celery_app.task(name="scanner.scan_folder")
def scan_folder() -> dict:
    folder = Path(settings.leads_dir)
    if not folder.exists():
        return {"scanned": 0, "enqueued": 0, "reason": f"missing {folder}"}

    md_files = sorted([p for p in folder.rglob("*.md") if p.is_file()])
    enqueued = 0
    for path in md_files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        fp = _fingerprint(path, content)
        if _r.sismember(PROCESSED_KEY, fp):
            continue
        enqueue_lead(content)
        _r.sadd(PROCESSED_KEY, fp)
        enqueued += 1
    return {"scanned": len(md_files), "enqueued": enqueued, "folder": str(folder)}
