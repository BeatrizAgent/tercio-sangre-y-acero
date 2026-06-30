import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ItemChestGrid, PLAYER_CHEST_GRID } from "@/components/soldier/item-chest-grid";

describe("ItemChestGrid", () => {
  it("renders a green drop preview with the dragged item footprint when placement is valid", () => {
    const { container } = render(
      <ItemChestGrid
        metrics={PLAYER_CHEST_GRID}
        dropPreview={{ itemId: "chest_cuirass_001", x: 2, y: 1, cols: 2, rows: 2, valid: true }}
      />,
    );

    const preview = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(preview.className).toContain("bg-emerald-500/30");
    expect(preview.style.left).toBe("124px");
    expect(preview.style.top).toBe("64px");
    expect(preview.style.width).toBe("116px");
    expect(preview.style.height).toBe("116px");
  });

  it("renders a red drop preview when placement is invalid", () => {
    const { container } = render(
      <ItemChestGrid
        metrics={PLAYER_CHEST_GRID}
        dropPreview={{ itemId: "chest_cuirass_001", x: 7, y: 4, cols: 2, rows: 2, valid: false }}
      />,
    );

    const preview = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(preview.className).toContain("bg-red-950/45");
  });
});
