// GladiatusBar: progress bar with hp/xp/fatigue tone.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GladiatusBar } from "@/components/ui/gladiatus-bar";

describe("GladiatusBar", () => {
  it("renders the value/max label", () => {
    render(<GladiatusBar value={50} max={100} type="hp" label="Vida" />);
    expect(screen.getByText("Vida: 50 / 100")).toBeInTheDocument();
  });

  it("shows the percentage when showPercentage=true", () => {
    render(<GladiatusBar value={25} max={100} type="xp" showPercentage />);
    expect(screen.getByText(/25 \/ 100 \(25%\)/)).toBeInTheDocument();
  });

  it("clamps the visual width to 100%", () => {
    const { container } = render(<GladiatusBar value={200} max={100} type="hp" />);
    const fill = container.querySelector(".gladiatus-bar-fill") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("renders 0% width when max is 0", () => {
    const { container } = render(<GladiatusBar value={0} max={0} type="fatigue" />);
    const fill = container.querySelector(".gladiatus-bar-fill") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });
});

