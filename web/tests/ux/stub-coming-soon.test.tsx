// StubComingSoon: small Card-based "en construccion" panel.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/sounds", () => ({
  playSwordSound: vi.fn(),
  playDrumSound: vi.fn(),
  playCoinSound: vi.fn(),
  playPageSound: vi.fn(),
  playDefeatSound: vi.fn(),
}));

import { StubComingSoon } from "@/components/ui/stub-coming-soon";

describe("StubComingSoon", () => {
  it("renders the title and description", () => {
    render(
      <StubComingSoon
        title="Inventario"
        description="Proximamente"
        backHref="/soldier"
        backLabel="Volver"
      />,
    );
    expect(screen.getByRole("heading", { name: "Inventario" })).toBeInTheDocument();
    expect(screen.getByText("Proximamente")).toBeInTheDocument();
    expect(screen.getByText("En construccion")).toBeInTheDocument();
  });

  it("shows the back link with the right href", () => {
    render(
      <StubComingSoon
        title="Inventario"
        description="Proximamente"
        backHref="/soldier"
        backLabel="Volver"
      />,
    );
    const link = screen.getByRole("link", { name: "Volver" });
    expect(link).toHaveAttribute("href", "/soldier");
  });
});
