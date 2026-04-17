FROM mcr.microsoft.com/playwright/python:v1.58.0-jammy

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    "celery[redis]" \
    redis \
    httpx \
    pydantic \
    pydantic-settings \
    google-genai \
    playwright \
    python-multipart \
    sse-starlette \
    beautifulsoup4                                                

COPY app ./app

ENV PYTHONUNBUFFERED=1 PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
