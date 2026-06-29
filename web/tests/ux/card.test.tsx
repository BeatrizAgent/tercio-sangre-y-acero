// Card / Badge: small UI primitives.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/sounds", () => ({
  playSwordSound: vi.fn(),
  playDrumSound: vi.fn(),
  playCoinSound: vi.fn(),
  playPageSound: vi.fn(),
  playDefeatSound: vi.fn(),
}));

import { Badge, Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders the title as a heading", () => {
    render(<Card title="Hoja de servicio">Cuerpo</Card>);
    expect(screen.getByRole("heading", { name: "Hoja de servicio" })).toBeInTheDocument();
    expect(screen.getByText("Cuerpo")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders the children text", () => {
    render(<Badge>Veterano</Badge>);
    expect(screen.getByText("Veterano")).toBeInTheDocument();
  });

  it("applies the variant class for tone", () => {
    const { container } = render(<Badge variant="danger">Herida</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toMatch(/danger/);
  });
});
