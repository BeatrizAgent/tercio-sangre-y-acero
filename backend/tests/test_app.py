from __future__ import annotations

from tercio_backend.app import create_app


def test_create_app_accepts_test_config() -> None:
    app = create_app({"TESTING": True, "TERCIO_CORS_ORIGIN": "http://localhost:3000"})

    assert app.testing is True


def test_health_endpoints_return_ok_and_catalog_counts() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    root_response = client.get("/health")
    api_response = client.get("/api/health")

    assert root_response.status_code == 200
    assert root_response.get_json()["ok"] is True
    assert api_response.status_code == 200
    body = api_response.get_json()
    assert body["ok"] is True
    assert body["catalog"]["source"] == "catalog-json"
    assert body["catalog"]["items"] > 0


def test_options_preflight_uses_configured_cors_origin() -> None:
    app = create_app({"TESTING": True, "TERCIO_CORS_ORIGIN": "http://localhost:3000"})
    client = app.test_client()

    response = client.options("/api/catalog")

    assert response.status_code == 204
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"
    assert "OPTIONS" in response.headers["Access-Control-Allow-Methods"]
    assert "Content-Type" in response.headers["Access-Control-Allow-Headers"]


def test_catalog_endpoint_returns_compatible_payload() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/api/catalog")

    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "catalog-json"
    assert isinstance(body["items"], list)
    assert isinstance(body["missions"], list)
    assert len(body["items"]) > 0


def test_character_names_endpoint_returns_static_names() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/api/character-names")

    assert response.status_code == 200
    body = response.get_json()
    assert body["locale"] == "es-ES"
    assert "Diego" in body["firstNames"]
    assert len(body["surnames"]) > 0
