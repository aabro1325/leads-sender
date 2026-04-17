from __future__ import annotations

import re

from ..celery_app import celery_app
from ..events import emit
from ..models import LeadStatus
from ..store import get_lead, set_status, update_lead


def _clean(s: str) -> str:
    return re.sub(r"[^a-z]", "", s.lower())


def patterns(first: str, last: str, domain: str) -> list[str]:
    f, l = _clean(first), _clean(last)
    if not (f and l and domain):
        return []
    locals_ = [
        f"{f}.{l}",
        f"{f}{l}",
        f"{f}_{l}",
        f"{f[0]}.{l}",
        f"{f[0]}{l}",
        f"{f}.{l[0]}",
        f"{f}{l[0]}",
        f"{f}-{l}",
        f"{l}.{f}",
        f,
        l,
    ]
    seen: list[str] = []
    for local in locals_:
        email = f"{local}@{domain}"
        if email not in seen:
            seen.append(email)
    return seen[:10]


@celery_app.task(name="steps.permute", bind=True)
def run(self, lead_id: str) -> str:
    set_status(lead_id, LeadStatus.PERMUTING)
    lead = get_lead(lead_id)
    assert lead is not None

    if not (lead.first_name and lead.last_name and lead.domain):
        emit(
            lead_id,
            "permute",
            "Missing required fields for permutation",
            level="error",
            data={"first": lead.first_name, "last": lead.last_name, "domain": lead.domain},
        )
        set_status(lead_id, LeadStatus.FAILED)
        raise RuntimeError("missing name/domain for permutation")

    candidates = patterns(lead.first_name, lead.last_name, lead.domain)
    update_lead(lead_id, candidate_emails=candidates)
    emit(lead_id, "permute", f"Generated {len(candidates)} candidate emails", data={"candidates": candidates})
    return lead_id
