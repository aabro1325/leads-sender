from __future__ import annotations

from ..celery_app import celery_app
from ..events import emit
from ..gemini import generate_json
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead

SCHEMA = {
    "type": "object",
    "properties": {
        "first_name": {"type": "string", "nullable": True},
        "last_name": {"type": "string", "nullable": True},
        "company": {"type": "string", "nullable": True},
        "domain": {"type": "string", "nullable": True},
        "title": {"type": "string", "nullable": True},
        "linkedin": {"type": "string", "nullable": True},
    },
    "required": ["first_name", "last_name", "company", "domain", "title", "linkedin"],
}

PROMPT = """You normalize unstructured lead notes into structured JSON.

From the markdown below, extract:
- first_name, last_name (person)
- company (legal/brand name)
- domain (apex domain only, no scheme/path, lowercase; infer from company if not explicit)
- title (role at company)
- linkedin (full URL if present)

If a field is genuinely unknown, return null. Do not invent data.

MARKDOWN:
---
{md}
---
"""


@celery_app.task(name="steps.normalize", bind=True)
def run(self, lead_id: str) -> str:
    set_status(lead_id, LeadStatus.NORMALIZING)
    emit(lead_id, "normalize", "Extracting fields from markdown with Gemini")
    lead = get_lead(lead_id)
    assert lead is not None

    data = generate_json(PROMPT.format(md=lead.source_md), SCHEMA)
    update_lead(
        lead_id,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        company=data.get("company"),
        domain=(data.get("domain") or "").lower().strip() or None,
        title=data.get("title"),
        linkedin=data.get("linkedin"),
    )
    emit(lead_id, "normalize", "Extracted lead fields", data=data)
    return lead_id
