from __future__ import annotations

from typing import Any

from .db import (
    db_delete_lead,
    db_get_lead,
    db_list_leads,
    db_upsert_lead,
)
from .models import Lead, LeadEvent, LeadStatus


def save_lead(lead: Lead) -> None:
    db_upsert_lead(lead.id, lead.created_at.timestamp(), lead.model_dump_json())


def get_lead(lead_id: str) -> Lead | None:
    raw = db_get_lead(lead_id)
    if not raw:
        return None
    return Lead.model_validate_json(raw)


def list_leads(limit: int = 100) -> list[Lead]:
    return [Lead.model_validate_json(raw) for raw in db_list_leads(limit)]


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


def delete_lead(lead_id: str) -> bool:
    return db_delete_lead(lead_id)
