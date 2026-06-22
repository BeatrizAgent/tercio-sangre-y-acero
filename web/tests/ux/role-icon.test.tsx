import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RoleIcon, roleIconFor } from "@/components/ui/role-icon";
import { Axe, Crosshair, HeartHandshake, Swords } from "lucide-react";

describe("roleIconFor", () => {
  it("returns Swords for Piquero", () => {
    expect(roleIconFor("Piquero")).toBe(Swords);
  });

  it("returns Crosshair for Tirador", () => {
    expect(roleIconFor("Tirador")).toBe(Crosshair);
  });

  it("returns HeartHandshake for Asistente", () => {
    expect(roleIconFor("Asistente")).toBe(HeartHandshake);
  });

  it("returns Swords for Jinete", () => {
    expect(roleIconFor("Jinete")).toBe(Swords);
  });

  it("returns Axe for Gastador", () => {
    expect(roleIconFor("Gastador")).toBe(Axe);
  });

  it("falls back to Swords for unknown roles", () => {
    expect(roleIconFor("Capitan")).toBe(Swords);
  });

  it("falls back to Swords when role is undefined", () => {
    expect(roleIconFor(undefined)).toBe(Swords);
  });
});

describe("RoleIcon", () => {
  it("renders an svg with the requested className", () => {
    const { container } = render(<RoleIcon role="Piquero" className="h-4 w-4" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("h-4");
    expect(svg).toHaveClass("w-4");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the default size when no className is given", () => {
    const { container } = render(<RoleIcon role="Tirador" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-3");
    expect(svg).toHaveClass("w-3");
  });
});
