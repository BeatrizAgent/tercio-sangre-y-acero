import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders a decorative shimmer block by default", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-20" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("skeleton-shimmer");
    expect(el).toHaveClass("rounded-xs");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-20");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).not.toHaveAttribute("role");
  });

  it("renders a status block with 'Cargando...' when not decorative", () => {
    render(<Skeleton data-testid="skeleton" decorative={false} />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveAttribute("role", "status");
    expect(el).toHaveAttribute("aria-live", "polite");
    expect(el).not.toHaveAttribute("aria-hidden");
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });
});

describe("SkeletonCircle", () => {
  it("renders a round shimmer block", () => {
    render(<SkeletonCircle data-testid="circle" className="h-8 w-8" />);
    const el = screen.getByTestId("circle");
    expect(el).toHaveClass("rounded-full");
    expect(el).toHaveClass("skeleton-shimmer");
  });
});

describe("SkeletonText", () => {
  it("renders the requested number of lines", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll(".skeleton-shimmer");
    expect(lines).toHaveLength(3);
  });

  it("shrinks the last line to the requested width", () => {
    const { container } = render(<SkeletonText lines={2} lastLineWidth={40} />);
    const lines = container.querySelectorAll(".skeleton-shimmer");
    const lastLine = lines[lines.length - 1] as HTMLElement;
    expect(lastLine.style.width).toBe("40%");
  });

  it("clamps line count to at least 1", () => {
    const { container } = render(<SkeletonText lines={0} />);
    expect(container.querySelectorAll(".skeleton-shimmer")).toHaveLength(1);
  });

  it("does not announce 'Cargando...' when decorative", () => {
    render(<SkeletonText lines={2} />);
    expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
  });
});
