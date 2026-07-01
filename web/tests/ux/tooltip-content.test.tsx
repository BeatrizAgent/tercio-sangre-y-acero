import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { useGameStoreMock } = vi.hoisted(() => ({
  useGameStoreMock: vi.fn(),
}));

vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));

import { SimpleTooltipContent } from "@/components/ui/tooltip/content-simple";
import { ItemTooltipContent } from "@/components/ui/tooltip/content-item";
import { WoundTooltipContent } from "@/components/ui/tooltip/content-wound";
import { createInitialState } from "@/lib/domain/initial-state";

describe("SimpleTooltipContent", () => {
  it("renders the content inside an italic quote", () => {
    render(<SimpleTooltipContent content="El barro es neutral." />);
    const el = screen.getByText(/El barro es neutral/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass("italic");
  });
});

describe("ItemTooltipContent", () => {
  it("formats item, stat, and coin icons inside the item popover", () => {
    useGameStoreMock.mockReturnValue(createInitialState());
    const { container } = render(<ItemTooltipContent itemId="weapon_pica_gastada_001" />);

    expect(screen.getByRole("img", { name: /pica/i })).toBeInTheDocument();
    expect(screen.getByText("Valor Sugerido")).toBeInTheDocument();
    expect(container.querySelector(".asset-icon-frame img")).not.toBeNull();
    expect(container.querySelector(".ui-asset-icon img")).not.toBeNull();
    expect(container.querySelector("span.inline-flex.h-4.w-4 img")).not.toBeNull();
  });

  it("keeps dense item popovers bounded and free of encoding escapes", () => {
    useGameStoreMock.mockReturnValue(createInitialState());
    const { container } = render(<ItemTooltipContent itemId="weapon_tizona_001" />);

    const text = container.textContent ?? "";
    expect(container.querySelector(".tooltip-item-panel")).not.toBeNull();
    expect(text).toContain("· Honor ≥");
    expect(text).toContain("Armadura");
    expect(text).toContain("Daño min.");
    expect(text).toContain("Daño max.");
    expect(text).not.toContain("\\u00b7");
    expect(text).not.toContain("\\u2265");
    expect(text).not.toContain("ComÃ");
    expect(text).not.toContain("misiÃ");
    expect(text).not.toContain("botÃ");
    expect(text).not.toContain("damageMin");
    expect(text).not.toContain("damageMax");
    expect(text).not.toContain("Armor");
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
