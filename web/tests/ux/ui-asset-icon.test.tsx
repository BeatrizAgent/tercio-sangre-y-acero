// UiAssetIcon: asset-backed icon span.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";

describe("UiAssetIcon", () => {
  it("renders an img with the icon src and alt", () => {
    render(<UiAssetIcon id="coins" label="Monedas" />);
    const img = screen.getByAltText("Monedas");
    expect(img.tagName).toBe("IMG");
    // The src points to /assets/gpt-bank/ui/icons/... regardless of id.
    expect(img.getAttribute("src")).toMatch(/assets\/gpt-bank\/ui\/icons\//);
  });

  it("applies the size class", () => {
    const { container } = render(<UiAssetIcon id="coins" label="Monedas" className="h-10 w-10" />);
    const span = container.firstElementChild as HTMLElement;
    expect(span.className).toMatch(/h-10/);
  });
});

