from __future__ import annotations

from flask import Blueprint

from tercio_backend.data import get_catalog_counts
from tercio_backend.http import json_model, options_response
from tercio_backend.schemas import HealthPayload, RootHealthPayload

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def root_health():
    return json_model(RootHealthPayload(ok=True, service="tercio-backend"))


@health_bp.route("/health", methods=["OPTIONS"])
def root_health_options():
    return options_response()


@health_bp.route("/api/health", methods=["GET"])
def api_health():
    return json_model(HealthPayload(ok=True, catalog=get_catalog_counts()))


@health_bp.route("/api/health", methods=["OPTIONS"])
def api_health_options():
    return options_response()
