import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlotPlaque } from "@/components/ui/slot-plaque";
import { FORMATION_META } from "@/lib/domain/formation";

describe("SlotPlaque", () => {
  it("renders the role label for the slot", () => {
    render(<SlotPlaque slot="vanguardia" count={3} />);
    expect(screen.getByText(FORMATION_META.vanguardia.label)).toBeInTheDocument();
  });

  it("renders the count when greater than 0", () => {
    render(<SlotPlaque slot="vanguardia" count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("omits the count when zero", () => {
    const { container } = render(<SlotPlaque slot="vanguardia" count={0} />);
    // The label and icon are still present, but no count number badge.
    expect(screen.queryByText("0")).toBeNull();
    expect(container).toBeInTheDocument();
  });

  it("appends 'swap' to the count when willSwap=true", () => {
    render(<SlotPlaque slot="vanguardia" count={2} willSwap />);
    expect(screen.getByText(/2\s*swap/)).toBeInTheDocument();
  });

  it("hides the icon when showIcon=false", () => {
    const { container } = render(
      <SlotPlaque slot="vanguardia" count={3} showIcon={false} />,
    );
    // Only the Lucide icon (aria-hidden) should remain, not the Image icon.
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(0);
  });

  it("hides the preferred stat when showPreferredStat=false", () => {
    render(
      <SlotPlaque
        slot="vanguardia"
        count={3}
        showPreferredStat={false}
      />,
    );
    const preferred = FORMATION_META.vanguardia.preferredStat;
    if (preferred) {
      // The stat label should not be present.
      expect(
        screen.queryByText(new RegExp(preferred, "i")),
      ).toBeNull();
    }
  });
});
