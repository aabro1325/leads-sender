from __future__ import annotations

from typing import Any

import redis

from .config import settings
from .models import Lead, LeadEvent, LeadStatus

_r = redis.Redis.from_url(settings.redis_url, decode_responses=True)

LEAD_KEY = "lead:{id}"
LEAD_INDEX = "leads:index"  # sorted set by created_at


def _key(lead_id: str) -> str:
    return LEAD_KEY.format(id=lead_id)


def save_lead(lead: Lead) -> None:
    _r.set(_key(lead.id), lead.model_dump_json())
    _r.zadd(LEAD_INDEX, {lead.id: lead.created_at.timestamp()})


def get_lead(lead_id: str) -> Lead | None:
    raw = _r.get(_key(lead_id))
    if not raw:
        return None
    return Lead.model_validate_json(raw)


def list_leads(limit: int = 100) -> list[Lead]:
    ids = _r.zrevrange(LEAD_INDEX, 0, limit - 1)
    out: list[Lead] = []
    for lid in ids:
        lead = get_lead(lid)
        if lead:
            out.append(lead)
    return out


def update_lead(lead_id: str, **fields: Any) -> Lead | None:
    lead = get_lead(lead_id)
    if not lead:
        return None
    for k, v in fields.items():
        setattr(lead, k, v)
    save_lead(lead)
    return lead


def set_status(lead_id: str, status: LeadStatus) -> None:
    update_lead(lead_id, status=status)


def append_event(lead_id: str, event: LeadEvent) -> None:
    lead = get_lead(lead_id)
    if not lead:
        return
    lead.events.append(event)
    save_lead(lead)


