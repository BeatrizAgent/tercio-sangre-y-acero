import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatChip, FatigueBar, fatigueTone, fatigueLabel } from "@/components/ui/stat-chip";

describe("StatChip", () => {
  it("matches the snapshot", () => {
    const { container } = render(<StatChip value={7} label="Pica" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders the value", () => {
    render(<StatChip value={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the label when provided", () => {
    render(<StatChip value={3} label="Pica" />);
    expect(screen.getByText("Pica")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("applies the tone class", () => {
    const { container } = render(<StatChip value={2} label="Vigor" tone="gold" />);
    const chip = container.querySelector("span");
    expect(chip).toHaveClass("border-gold/45");
  });

  it("uses compact text size when compact=true", () => {
    const { container } = render(<StatChip value={2} label="Pica" compact />);
    expect(container.querySelector("span")).toHaveClass("text-[10px]");
  });

  it("uses regular text size by default", () => {
    const { container } = render(<StatChip value={2} label="Pica" />);
    expect(container.querySelector("span")).toHaveClass("text-[11px]");
  });
});

describe("fatigueTone / fatigueLabel", () => {
  it("classifies values above 75 as agotado/danger", () => {
    expect(fatigueTone(76)).toBe("danger");
    expect(fatigueTone(100)).toBe("danger");
    expect(fatigueLabel(80)).toBe("agotado");
  });

  it("classifies values between 41 and 75 as cansado/ember", () => {
    expect(fatigueTone(50)).toBe("ember");
    expect(fatigueTone(75)).toBe("ember");
    expect(fatigueLabel(50)).toBe("cansado");
  });

  it("classifies values 40 or below as fresco/success", () => {
    expect(fatigueTone(0)).toBe("success");
    expect(fatigueTone(40)).toBe("success");
    expect(fatigueLabel(0)).toBe("fresco");
  });
});

describe("FatigueBar", () => {
  it("renders a progressbar with aria attributes", () => {
    render(<FatigueBar value={50} ariaLabel="Fatiga de Diego" />);
    const bar = screen.getByRole("progressbar", { name: "Fatiga de Diego" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("shows the label by default", () => {
    render(<FatigueBar value={50} />);
    expect(screen.getByText(/50 . cansado/)).toBeInTheDocument();
  });

  it("hides the label when showLabel=false", () => {
    render(<FatigueBar value={50} showLabel={false} />);
    expect(screen.queryByText(/cansado/)).toBeNull();
  });

  it("clamps the visual width to 0-100", () => {
    render(<FatigueBar value={150} />);
    const bar = screen.getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });
});
