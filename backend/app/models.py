from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class LeadStatus(str, Enum):
    QUEUED = "QUEUED"
    PENDING = "PENDING"
    NORMALIZING = "NORMALIZING"
    PERMUTING = "PERMUTING"
    VERIFYING = "VERIFYING"
    VERIFIED = "VERIFIED"
    DEAD = "DEAD"
    RESEARCHING = "RESEARCHING"
    DRAFTING = "DRAFTING"
    SENDING = "SENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class LeadEvent(BaseModel):
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lead_id: str
    step: str
    level: Literal["info", "warn", "error"] = "info"
    message: str
    data: dict[str, Any] | None = None


class Lead(BaseModel):
    id: str
    source_md: str
    first_name: str | None = None
    last_name: str | None = None
    company: str | None = None
    domain: str | None = None
    title: str | None = None
    linkedin: str | None = None
    candidate_emails: list[str] = []
    verified_email: str | None = None
    research: dict[str, Any] | None = None
    draft_subject: str | None = None
    draft_body: str | None = None
    resend_message_id: str | None = None
    status: LeadStatus = LeadStatus.PENDING
    events: list[LeadEvent] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
