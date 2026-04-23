from __future__ import annotations

import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from .db import init_db
from .events import GLOBAL_CHANNEL, LEAD_CHANNEL, subscribe
from .models import LeadStatus
from .pipeline import enqueue_lead, retry_lead
from .store import delete_lead, get_lead, list_leads

app = FastAPI(title="Lead Sender")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateLeadBody(BaseModel):
    markdown: str


@app.get("/api/leads")
def api_list_leads():
    return [lead.model_dump(mode="json") for lead in list_leads()]


@app.get("/api/leads/{lead_id}")
def api_get_lead(lead_id: str):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(404, "lead not found")
    return lead.model_dump(mode="json")


@app.post("/api/leads")
async def api_create_lead(body: CreateLeadBody):
    if not body.markdown.strip():
        raise HTTPException(400, "markdown cannot be empty")
    lead = enqueue_lead(body.markdown)
    return lead.model_dump(mode="json")


_ACTIVE_STATUSES = {
    LeadStatus.PENDING,
    LeadStatus.NORMALIZING,
    LeadStatus.PERMUTING,
    LeadStatus.VERIFYING,
    LeadStatus.RESEARCHING,
    LeadStatus.DRAFTING,
    LeadStatus.SENDING,
}


@app.get("/api/queue")
def api_queue_stats():
    all_leads = list_leads(limit=500)
    active = [l for l in all_leads if l.status in _ACTIVE_STATUSES]
    queued = sorted(
        [l for l in all_leads if l.status == LeadStatus.QUEUED],
        key=lambda l: l.created_at,
    )
    return {
        "active_count": len(active),
        "queued_count": len(queued),
        "queue": [
            {"id": l.id, "position": i + 1, "first_name": l.first_name, "last_name": l.last_name, "company": l.company}
            for i, l in enumerate(queued)
        ],
    }


@app.post("/api/leads/{lead_id}/retry")
def api_retry_lead(lead_id: str):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(404, "lead not found")
    if lead.status not in (LeadStatus.FAILED, LeadStatus.DEAD):
        raise HTTPException(400, f"lead is {lead.status}, only FAILED or DEAD leads can be retried")
    updated = retry_lead(lead_id)
    return updated.model_dump(mode="json")


@app.delete("/api/leads/{lead_id}")
def api_delete_lead(lead_id: str):
    if not delete_lead(lead_id):
        raise HTTPException(404, "lead not found")
    return {"ok": True, "id": lead_id}


async def _sse(channel: str):
    async for payload in subscribe(channel):
        yield {"event": "lead", "data": payload}
        await asyncio.sleep(0)


@app.get("/api/stream")
async def stream_all():
    return EventSourceResponse(_sse(GLOBAL_CHANNEL))


@app.get("/api/stream/{lead_id}")
async def stream_one(lead_id: str):
    return EventSourceResponse(_sse(LEAD_CHANNEL.format(id=lead_id)))


@app.get("/api/health")
def health():
    return {"ok": True}
