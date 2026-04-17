from __future__ import annotations

import httpx

from ..celery_app import celery_app
from ..config import settings
from ..events import emit
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead

RESEND_URL = "https://api.resend.com/emails"


@celery_app.task(name="steps.send", bind=True)
def run(self, lead_id: str) -> str:
    if not lead_id:
        return lead_id
    lead = get_lead(lead_id)
    assert lead is not None
    if lead.status == LeadStatus.DEAD:
        return lead_id

    if not (lead.verified_email and lead.draft_subject and lead.draft_body):
        emit(lead_id, "send", "Missing verified email or draft; cannot send", level="error")
        set_status(lead_id, LeadStatus.FAILED)
        return lead_id

    set_status(lead_id, LeadStatus.SENDING)
    emit(lead_id, "send", f"Sending via Resend to {lead.verified_email}")

    resp = httpx.post(
        RESEND_URL,
        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        json={
            "from": settings.resend_from,
            "to": [lead.verified_email],
            "subject": lead.draft_subject,
            "text": lead.draft_body,
        },
        timeout=30,
    )

    if resp.status_code >= 300:
        emit(lead_id, "send", f"Resend error {resp.status_code}: {resp.text}", level="error")
        set_status(lead_id, LeadStatus.FAILED)
        return lead_id

    message_id = resp.json().get("id")
    update_lead(lead_id, resend_message_id=message_id, status=LeadStatus.SENT)
    emit(lead_id, "send", "Email sent", data={"message_id": message_id})
    return lead_id
