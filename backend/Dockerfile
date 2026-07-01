FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libatomic1 nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./pyproject.toml
COPY backend/src ./src
COPY backend/tests ./tests

RUN pip install --no-cache-dir -e ".[dev]"

EXPOSE 5000

CMD ["flask", "--app", "tercio_backend.app:create_app", "run", "--host=0.0.0.0", "--port=5000", "--debug"]
