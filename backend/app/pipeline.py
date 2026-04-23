from __future__ import annotations

import traceback
import uuid

from celery import chain

from .celery_app import celery_app
from .events import emit
from .models import Lead, LeadStatus
from .store import list_leads, save_lead, set_status
from .steps import draft, normalize, permute, research, send, verify

_ACTIVE_STATUSES = {
    LeadStatus.PENDING,
    LeadStatus.NORMALIZING,
    LeadStatus.PERMUTING,
    LeadStatus.VERIFYING,
    LeadStatus.RESEARCHING,
    LeadStatus.DRAFTING,
    LeadStatus.SENDING,
}

_STEP_TASKS = {
    "normalize": normalize.run,
    "permute": permute.run,
    "verify": verify.run,
    "research": research.run,
    "draft": draft.run,
    "send": send.run,
}
_STEP_ORDER = ["normalize", "permute", "verify", "research", "draft", "send"]


def _resume_step(lead: Lead) -> str:
    """Infer which step to resume from based on what data already exists on the lead."""
    if lead.draft_subject and lead.draft_body:
        return "send"
    if lead.research is not None:
        return "draft"
    if lead.verified_email:
        return "research"
    if lead.candidate_emails:
        return "verify"
    if lead.first_name or lead.last_name or lead.company or lead.domain:
        return "permute"
    return "normalize"


def _start_pipeline_from(lead_id: str, from_step: str) -> None:
    idx = _STEP_ORDER.index(from_step)
    remaining = _STEP_ORDER[idx:]
    tasks = [_STEP_TASKS[remaining[0]].s(lead_id)]
    tasks += [_STEP_TASKS[s].s() for s in remaining[1:]]
    chain(*tasks).apply_async(link_error=on_error.s(lead_id))


def _start_pipeline(lead_id: str) -> None:
    _start_pipeline_from(lead_id, "normalize")


def retry_lead(lead_id: str) -> Lead:
    from .store import get_lead, update_lead

    lead = get_lead(lead_id)
    assert lead is not None

    from_step = _resume_step(lead)
    all_leads = list_leads(limit=500)
    is_busy = any(l.status in _ACTIVE_STATUSES and l.id != lead_id for l in all_leads)

    if is_busy:
        update_lead(lead_id, status=LeadStatus.QUEUED)
        queue_pos = sum(1 for l in all_leads if l.status == LeadStatus.QUEUED) + 1
        emit(lead_id, "pipeline", f"Retrying from {from_step} — added to queue (position {queue_pos})")
    else:
        update_lead(lead_id, status=LeadStatus.PENDING)
        emit(lead_id, "pipeline", f"Retrying from {from_step}")
        _start_pipeline_from(lead_id, from_step)

    return get_lead(lead_id)  # type: ignore[return-value]


def enqueue_lead(source_md: str) -> Lead:
    lead_id = str(uuid.uuid4())

    all_leads = list_leads(limit=500)
    is_busy = any(l.status in _ACTIVE_STATUSES for l in all_leads)

    if is_busy:
        lead = Lead(id=lead_id, source_md=source_md, status=LeadStatus.QUEUED)
        save_lead(lead)
        queue_pos = sum(1 for l in all_leads if l.status == LeadStatus.QUEUED) + 1
        emit(lead_id, "pipeline", f"Lead added to queue (position {queue_pos})", data={"length": len(source_md)})
    else:
        lead = Lead(id=lead_id, source_md=source_md, status=LeadStatus.PENDING)
        save_lead(lead)
        emit(lead_id, "pipeline", "Lead queued", data={"length": len(source_md)})
        _start_pipeline(lead_id)

    return lead


@celery_app.task(name="queue.advance")
def advance_queue() -> None:
    all_leads = list_leads(limit=500)
    is_busy = any(l.status in _ACTIVE_STATUSES for l in all_leads)
    if is_busy:
        return

    queued = sorted(
        [l for l in all_leads if l.status == LeadStatus.QUEUED],
        key=lambda l: l.created_at,
    )
    if not queued:
        return

    next_lead = queued[0]
    set_status(next_lead.id, LeadStatus.PENDING)
    emit(next_lead.id, "pipeline", "Dequeued — starting pipeline")
    _start_pipeline(next_lead.id)


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
    finally:
        advance_queue.delay()
