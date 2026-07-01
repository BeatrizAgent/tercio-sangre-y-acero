from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from flask import Flask, Response, request

from .config import DEFAULT_CONFIG
from .http import add_cors_headers, options_response
from .routes.catalog import catalog_bp
from .routes.health import health_bp


def create_app(test_config: Mapping[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(DEFAULT_CONFIG)
    if test_config is not None:
        app.config.from_mapping(test_config)

    app.register_blueprint(health_bp)
    app.register_blueprint(catalog_bp)

    @app.after_request
    def apply_cors(response: Response) -> Response:
        return add_cors_headers(response, str(app.config["TERCIO_CORS_ORIGIN"]))

    @app.before_request
    def handle_options() -> Response | None:
        if request.method == "OPTIONS":
            return options_response()
        return None

    @app.route("/<path:_path>", methods=["OPTIONS"])
    @app.route("/", methods=["OPTIONS"])
    def options(_path: str | None = None) -> Response:  # noqa: ARG001
        return options_response()

    return app
