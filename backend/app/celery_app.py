from celery import Celery

from .config import settings

celery_app = Celery(
    "lead_sender",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.steps.normalize",
        "app.steps.permute",
        "app.steps.verify",
        "app.steps.research",
        "app.steps.draft",
        "app.steps.send",
        "app.pipeline",
        "app.scanner",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    task_track_started=True,
    beat_schedule={
        "scan-leads-folder": {
            "task": "scanner.scan_folder",
            "schedule": float(settings.scan_interval_seconds),
        },
    },
)
