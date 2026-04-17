from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

from ..celery_app import celery_app
from ..config import settings
from ..events import emit
from ..gemini import generate_json
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead

SCHEMA = {
    "type": "object",
    "properties": {
        "company_summary": {"type": "string"},
        "person_summary": {"type": "string"},
        "buy_reasons": {"type": "array", "items": {"type": "string"}},
        "personalization_hooks": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["company_summary", "person_summary", "buy_reasons", "personalization_hooks"],
}


def _load_product_brief() -> str:
    p = Path(settings.product_md_path)
    if not p.exists():
        return "(product brief not provided)"
    return p.read_text(encoding="utf-8")


def _scrape(lead_id: str, urls: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 LeadSenderBot")
        for url in urls:
            try:
                page = context.new_page()
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                html = page.content()
                page.close()
                text = BeautifulSoup(html, "html.parser").get_text(" ", strip=True)[:4000]
                out[url] = text
                emit(lead_id, "research", f"Scraped {url}", data={"chars": len(text)})
            except Exception as e:
                emit(lead_id, "research", f"Failed {url}: {e}", level="warn")
        browser.close()
    return out


@celery_app.task(name="steps.research", bind=True)
def run(self, lead_id: str) -> str:
    if not lead_id:
        return lead_id
    lead = get_lead(lead_id)
    assert lead is not None
    if lead.status == LeadStatus.DEAD:
        return lead_id

    set_status(lead_id, LeadStatus.RESEARCHING)
    product_brief = _load_product_brief()
    emit(lead_id, "research", "Loaded product brief", data={"chars": len(product_brief)})

    urls = []
    if lead.domain:
        urls.extend([f"https://{lead.domain}", f"https://{lead.domain}/about"])
    if lead.linkedin:
        urls.append(lead.linkedin)

    scraped = _scrape(lead_id, urls)
    context_blob = "\n\n".join(f"### {u}\n{t}" for u, t in scraped.items())

    prompt = f"""You are a B2B research analyst. Given the PRODUCT we sell and the PROSPECT context, decide why this person's company might buy the product and surface specific personalization hooks.

PRODUCT BRIEF:
{product_brief}

PROSPECT:
- Name: {lead.first_name} {lead.last_name}
- Title: {lead.title}
- Company: {lead.company}
- Domain: {lead.domain}

SCRAPED CONTEXT:
{context_blob or '(no scraped content available)'}

Return JSON with:
- company_summary (2-3 sentences)
- person_summary (1-2 sentences)
- buy_reasons (3 concrete reasons this company specifically would benefit from the product)
- personalization_hooks (2 specific details from scraped context to reference in the email)
"""

    emit(lead_id, "research", "Calling Gemini to synthesize research")
    research = generate_json(prompt, SCHEMA)
    update_lead(lead_id, research=research)
    emit(lead_id, "research", "Research complete", data=research)
    return lead_id
