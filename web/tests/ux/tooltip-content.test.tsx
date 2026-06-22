import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimpleTooltipContent } from "@/components/ui/tooltip/content-simple";
import { WoundTooltipContent } from "@/components/ui/tooltip/content-wound";

describe("SimpleTooltipContent", () => {
  it("renders the content inside an italic quote", () => {
    render(<SimpleTooltipContent content="El barro es neutral." />);
    const el = screen.getByText(/El barro es neutral/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass("italic");
  });
});

describe("WoundTooltipContent", () => {
  it("returns null when woundId is missing", () => {
    const { container } = render(<WoundTooltipContent />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the wound name from the catalog", () => {
    render(<WoundTooltipContent woundId="wound_corte_mano_001" />);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Corte en la mano");
  });

  it("renders the 'Abierta' badge when the wound is not treated", () => {
    render(<WoundTooltipContent woundId="wound_corte_mano_001" />);
    expect(screen.getByText("Abierta")).toBeInTheDocument();
  });

  it("renders the 'Tratada' badge when the wound is treated", () => {
    render(<WoundTooltipContent woundId="wound_corte_mano_001" treated />);
    expect(screen.getByText("Tratada")).toBeInTheDocument();
  });

  it("shows a fallback for unknown wound ids", () => {
    render(<WoundTooltipContent woundId="nonexistent_wound" />);
    expect(screen.getByText(/Herida desconocida/)).toBeInTheDocument();
  });
});
