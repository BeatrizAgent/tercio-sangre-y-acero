import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  FormationBackdrop,
  FormationField,
  CampBackdrop,
  UiArtFrame,
  FORMATION_FIELD_BG,
} from "@/components/ui/formation-backdrop";

describe("FORMATION_FIELD_BG", () => {
  it("points to the painted camp field asset", () => {
    expect(FORMATION_FIELD_BG).toMatch(/\.png$/);
  });
});

describe("FormationField", () => {
  it("renders an aria-hidden background layer with the field image", () => {
    const { container } = render(<FormationField />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.style.backgroundImage).toContain(FORMATION_FIELD_BG);
  });
});

describe("CampBackdrop", () => {
  it("renders a vignette overlay and decorative blobs", () => {
    const { container } = render(<CampBackdrop />);
    expect(container.children.length).toBeGreaterThan(0);
  });
});

describe("UiArtFrame", () => {
  it("renders four corner decorations and smoke/mud overlays", () => {
    const { container } = render(<UiArtFrame />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(6);
  });
});

describe("FormationBackdrop", () => {
  it("composes field, frame, and camp backdrop when withFrame=true", () => {
    const { container } = render(<FormationBackdrop />);
    expect(container.children.length).toBeGreaterThan(5);
  });

  it("omits the frame decorations when withFrame=false", () => {
    const full = render(<FormationBackdrop withFrame />);
    const minimal = render(<FormationBackdrop withFrame={false} />);
    const fullCount = full.container.querySelectorAll("img").length;
    const minimalCount = minimal.container.querySelectorAll("img").length;
    expect(minimalCount).toBeLessThan(fullCount);
  });
});
