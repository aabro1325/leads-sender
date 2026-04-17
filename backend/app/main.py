from __future__ import annotations

import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from .events import GLOBAL_CHANNEL, LEAD_CHANNEL, subscribe
from .pipeline import enqueue_lead
from .store import get_lead, list_leads

app = FastAPI(title="Lead Sender")

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
