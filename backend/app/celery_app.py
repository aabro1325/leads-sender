from celery import Celery
from celery.signals import worker_ready

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
    ],
)

@worker_ready.connect
def on_worker_ready(**kwargs):
    from .db import init_db
    init_db()


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    task_track_started=True,
)
