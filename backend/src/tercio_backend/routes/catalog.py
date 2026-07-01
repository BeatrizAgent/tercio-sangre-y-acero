from __future__ import annotations

from flask import Blueprint

from tercio_backend.data import get_catalog_payload, get_character_names_payload
from tercio_backend.http import json_model, options_response

catalog_bp = Blueprint("catalog", __name__)


@catalog_bp.route("/api/catalog", methods=["GET"])
def catalog():
    return json_model(get_catalog_payload())


@catalog_bp.route("/api/catalog", methods=["OPTIONS"])
def catalog_options():
    return options_response()


@catalog_bp.route("/api/character-names", methods=["GET"])
def character_names():
    return json_model(get_character_names_payload())


@catalog_bp.route("/api/character-names", methods=["OPTIONS"])
def character_names_options():
    return options_response()
