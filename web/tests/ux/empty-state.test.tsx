import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders the title in uppercase gold", () => {
    render(<EmptyState title="Sin reclutas" />);
    const title = screen.getByText("Sin reclutas");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("text-gold-soft");
    expect(title).toHaveClass("font-cinzel");
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState
        title="Sin reclutas"
        description="Vuelve al barracon cuando lleguen."
      />,
    );
    expect(screen.getByText("Vuelve al barracon cuando lleguen.")).toBeInTheDocument();
  });

  it("renders the action slot when provided", () => {
    render(
      <EmptyState
        title="Vacio"
        action={<button type="button">Recargar</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
  });

  it("renders without an icon when none is given", () => {
    const { container } = render(<EmptyState title="Vacio" />);
    expect(container.querySelector("svg, img")).toBeNull();
  });
});
