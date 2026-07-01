from __future__ import annotations

from tercio_backend.schemas import CatalogCounts, CharacterNamesPayload, HealthPayload


def test_health_payload_serializes_with_catalog_counts() -> None:
    payload = HealthPayload(
        ok=True,
        catalog=CatalogCounts(
            source="catalog-json",
            assets=1,
            items=2,
            enemies=3,
            ranks=4,
            missions=5,
            wounds=6,
            events=7,
            training=8,
            characters=9,
            lootTables=10,
            reportFragments=11,
        ),
    )

    assert payload.model_dump()["catalog"]["items"] == 2


def test_character_names_payload_requires_name_lists() -> None:
    payload = CharacterNamesPayload(
        version=1,
        locale="es-ES",
        era="16-17th century",
        region="Castilla y tercios",
        description="Seed names",
        firstNames=["Diego"],
        surnames=["Arce"],
    )

    assert payload.firstNames == ["Diego"]
