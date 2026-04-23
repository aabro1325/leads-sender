from __future__ import annotations

import time

import httpx

from ..celery_app import celery_app
from ..config import settings
from ..events import emit
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead

REOON_URL = "https://emailverifier.reoon.com/api/v1/verify"
GOOD_STATUSES = {"safe", "valid", "deliverable"}


def _verify_one(email: str) -> dict:
    with httpx.Client(timeout=30) as client:
        resp = client.get(
            REOON_URL,
            params={"email": email, "key": settings.reoon_api_key, "mode": "power"},
        )
        resp.raise_for_status()
        return resp.json()


@celery_app.task(name="steps.verify", bind=True)
def run(self, lead_id: str) -> str:
    set_status(lead_id, LeadStatus.VERIFYING)
    lead = get_lead(lead_id)
    assert lead is not None

    emit(lead_id, "verify", f"Verifying {len(lead.candidate_emails)} candidates via Reoon")
    verified: str | None = None
    for email in lead.candidate_emails:
        emit(lead_id, "verify", f"Checking {email}")
        try:
            result = _verify_one(email)
        except Exception as e:
            emit(lead_id, "verify", f"Error for {email}: {e}", level="warn")
            continue
        status = str(result.get("status", "")).lower()
        emit(lead_id, "verify", f"{email} → {status}", data=result)
        if status in GOOD_STATUSES:
            verified = email
            break
        time.sleep(1)

    if not verified:
        update_lead(lead_id, status=LeadStatus.DEAD)
        emit(lead_id, "verify", "No deliverable address found — lead marked DEAD", level="warn")
        self.request.callbacks = None  # abort remainder of chain (Celery 4)
        self.request.chain = None      # abort remainder of chain (Celery 5)
        celery_app.send_task("queue.advance")
        return lead_id

    update_lead(lead_id, verified_email=verified, status=LeadStatus.VERIFIED)
    emit(lead_id, "verify", f"Verified: {verified}", data={"verified_email": verified})
    return lead_id
