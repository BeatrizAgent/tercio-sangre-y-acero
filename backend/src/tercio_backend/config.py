from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_CONFIG = {
    "DATABASE_URL": os.getenv("DATABASE_URL", ""),
    "TERCIO_CORS_ORIGIN": os.getenv("TERCIO_CORS_ORIGIN", "https://tercios.yampi.eu"),
    "TERCIO_DATA_DIR": os.getenv("TERCIO_DATA_DIR", str(PROJECT_ROOT / "data")),
}
