from __future__ import annotations

import traceback
import uuid

from celery import chain

from .celery_app import celery_app
from .events import emit
from .models import Lead, LeadStatus
from .store import save_lead, set_status
from .steps import draft, normalize, permute, research, send, verify


def enqueue_lead(source_md: str) -> Lead:
    lead_id = str(uuid.uuid4())
    lead = Lead(id=lead_id, source_md=source_md, status=LeadStatus.PENDING)
    save_lead(lead)
    emit(lead_id, "pipeline", "Lead queued", data={"length": len(source_md)})

    workflow = chain(
        normalize.run.s(lead_id),
        permute.run.s(),
        verify.run.s(),
        research.run.s(),
        draft.run.s(),
        send.run.s(),
    )
    workflow.apply_async(link_error=on_error.s(lead_id))
    return lead


@celery_app.task(name="pipeline.on_error")
def on_error(request, exc, traceback_str, lead_id: str):  # pragma: no cover
    try:
        set_status(lead_id, LeadStatus.FAILED)
        emit(
            lead_id,
            "pipeline",
            f"Pipeline failed: {exc}",
            level="error",
            data={"traceback": str(traceback_str)[-4000:]},
        )
    except Exception:
        traceback.print_exc()
