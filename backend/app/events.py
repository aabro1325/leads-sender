from __future__ import annotations

from typing import Any, AsyncIterator

import redis
import redis.asyncio as aioredis

from .config import settings
from .models import LeadEvent
from .store import append_event

_r = redis.Redis.from_url(settings.redis_url, decode_responses=True)

GLOBAL_CHANNEL = "leads:events"
LEAD_CHANNEL = "leads:{id}"


def emit(
    lead_id: str,
    step: str,
    message: str,
    *,
    level: str = "info",
    data: dict[str, Any] | None = None,
) -> LeadEvent:
    ev = LeadEvent(lead_id=lead_id, step=step, level=level, message=message, data=data)
    payload = ev.model_dump_json()
    append_event(lead_id, ev)
    _r.publish(GLOBAL_CHANNEL, payload)
    _r.publish(LEAD_CHANNEL.format(id=lead_id), payload)
    return ev


async def subscribe(channel: str) -> AsyncIterator[str]:
    r = aioredis.from_url(settings.redis_url, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for msg in pubsub.listen():
            if msg.get("type") == "message":
                yield msg["data"]
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await r.aclose()
