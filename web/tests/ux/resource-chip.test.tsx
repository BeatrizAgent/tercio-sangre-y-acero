import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourceChip, QuickAction } from "@/components/ui/resource-chip";

describe("ResourceChip", () => {
  it("renders the label and value", () => {
    render(<ResourceChip icon="coins" label="Monedas" value={25} />);
    expect(screen.getByText("Monedas")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("exposes a native title with label and value", () => {
    render(<ResourceChip icon="honor" label="Honor" value={3} />);
    const chip = screen.getByTitle("Honor: 3");
    expect(chip).toBeInTheDocument();
  });

  it("applies the tone class to the value", () => {
    render(
      <ResourceChip icon="honor" label="Honor" value={5} tone="text-gold" />,
    );
    const value = screen.getByText("5");
    expect(value).toHaveClass("text-gold");
  });

  it("uses compact padding when compact=true", () => {
    const { container } = render(
      <ResourceChip icon="honor" label="Honor" value={5} compact />,
    );
    const chip = container.querySelector(".gladiatus-resource-chip");
    expect(chip).toHaveClass("px-1");
    expect(chip).toHaveClass("py-0.5");
  });
});

describe("QuickAction", () => {
  it("renders the label and value/max", () => {
    render(<QuickAction href="/missions" icon="missions" label="Misiones" value={2} max={5} />);
    expect(screen.getByText("Misiones")).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
  });

  it("renders as a link with the given href", () => {
    render(<QuickAction href="/missions" icon="missions" label="Misiones" value={2} max={5} />);
    const link = screen.getByRole("link", { name: /Misiones/ });
    expect(link).toHaveAttribute("href", "/missions");
  });

  it("renders a progressbar with value/max attributes", () => {
    render(<QuickAction href="/missions" icon="missions" label="Misiones" value={2} max={5} />);
    const bar = screen.getByRole("progressbar", { name: /Misiones restantes/ });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });

  it("clamps the bar width between 0 and 100 percent", () => {
    render(
      <QuickAction href="/missions" icon="missions" label="Misiones" value={10} max={5} />,
    );
    const bar = screen.getByRole("progressbar", { name: /Misiones restantes/ });
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("renders a 0% bar when max is 0", () => {
    render(
      <QuickAction href="/missions" icon="missions" label="Misiones" value={0} max={0} />,
    );
    const bar = screen.getByRole("progressbar", { name: /Misiones restantes/ });
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("calls onNavigate when clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <QuickAction
        href="/missions"
        icon="missions"
        label="Misiones"
        value={2}
        max={5}
        onNavigate={onNavigate}
      />,
    );
    const link = screen.getByRole("link", { name: /Misiones/ });
    await user.click(link);
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
