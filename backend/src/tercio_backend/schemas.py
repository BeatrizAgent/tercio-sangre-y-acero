from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TercioModel(BaseModel):
    model_config = ConfigDict(extra="allow")


type JsonObject = dict[str, object]


class RootHealthPayload(TercioModel):
    ok: bool
    service: Literal["tercio-backend"]


class CatalogCounts(TercioModel):
    source: str
    assets: int
    items: int
    enemies: int
    ranks: int
    missions: int
    wounds: int
    events: int
    training: int
    characters: int
    lootTables: int
    reportFragments: int


class HealthPayload(TercioModel):
    ok: bool
    catalog: CatalogCounts


class CatalogPayload(TercioModel):
    source: Literal["catalog-json"]
    assets: list[JsonObject] = Field(default_factory=list)
    items: list[JsonObject] = Field(default_factory=list)
    enemies: list[JsonObject] = Field(default_factory=list)
    ranks: list[JsonObject] = Field(default_factory=list)
    missions: list[JsonObject] = Field(default_factory=list)
    wounds: list[JsonObject] = Field(default_factory=list)
    events: list[JsonObject] = Field(default_factory=list)
    training: list[JsonObject] = Field(default_factory=list)
    characters: list[JsonObject] = Field(default_factory=list)
    lootTables: list[JsonObject] = Field(default_factory=list)
    reportFragments: list[JsonObject] = Field(default_factory=list)


class CharacterNamesPayload(TercioModel):
    version: int
    locale: str
    era: str
    region: str
    description: str
    firstNames: list[str]
    surnames: list[str]
