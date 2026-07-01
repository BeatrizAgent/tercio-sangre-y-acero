from __future__ import annotations

from typing import Any

from flask import Response, jsonify
from pydantic import BaseModel


def json_model(model: BaseModel, status: int = 200) -> Response:
    response = jsonify(model.model_dump(mode="json"))
    response.status_code = status
    return response


def json_data(data: dict[str, Any], status: int = 200) -> Response:
    response = jsonify(data)
    response.status_code = status
    return response


def add_cors_headers(response: Response, origin: str) -> Response:
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


def options_response() -> Response:
    response = Response(status=204)
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response
