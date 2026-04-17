from __future__ import annotations

import json
from pathlib import Path

from ..celery_app import celery_app
from ..config import settings
from ..events import emit
from ..gemini import generate_json_stream
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead

SCHEMA = {
    "type": "object",
    "properties": {
        "subject": {"type": "string"},
        "body": {"type": "string"},
    },
    "required": ["subject", "body"],
}


@celery_app.task(name="steps.draft", bind=True)
def run(self, lead_id: str) -> str:
    if not lead_id:
        return lead_id
    lead = get_lead(lead_id)
    assert lead is not None
    if lead.status == LeadStatus.DEAD:
        return lead_id

    set_status(lead_id, LeadStatus.DRAFTING)

    product_brief = Path(settings.product_md_path).read_text(encoding="utf-8") if Path(settings.product_md_path).exists() else ""
    prompt = f"""Write a cold email that feels hand-written by a founder.

HARD RULES:
- Plain text, no markdown, no emojis.
- Max 110 words in body.
- Open with a line that proves you did your homework (use a personalization hook).
- One clear CTA at the end (ask for a 15-minute call or a reply).
- No phrases like "I hope this finds you well", "quick question", or "just following up".
- Subject: under 50 chars, lowercase, feels like a real human wrote it.

PRODUCT BRIEF:
{product_brief}

PROSPECT:
{json.dumps({
    'first_name': lead.first_name,
    'last_name': lead.last_name,
    'title': lead.title,
    'company': lead.company,
    'domain': lead.domain,
    'email': lead.verified_email,
}, indent=2)}

RESEARCH:
{json.dumps(lead.research, indent=2) if lead.research else '(no research)'}

Return JSON: {{"subject": "...", "body": "..."}}
"""

    emit(lead_id, "draft", "Drafting personalized email (streaming)")
    accumulated = ""
    for chunk in generate_json_stream(prompt, SCHEMA):
        accumulated += chunk
        emit(lead_id, "draft", "token", data={"chunk": chunk})

    try:
        parsed = json.loads(accumulated)
    except json.JSONDecodeError as e:
        emit(lead_id, "draft", f"Failed to parse draft JSON: {e}", level="error", data={"raw": accumulated})
        raise

    update_lead(lead_id, draft_subject=parsed["subject"], draft_body=parsed["body"])
    emit(lead_id, "draft", "Draft complete", data=parsed)
    return lead_id
