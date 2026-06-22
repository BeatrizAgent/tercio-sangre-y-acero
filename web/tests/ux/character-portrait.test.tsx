import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterPortrait } from "@/components/ui/character-portrait";

describe("CharacterPortrait", () => {
  it("falls back to initials when no asset is provided", () => {
    render(<CharacterPortrait assetId={undefined} name="Diego de Arce" />);
    const initials = screen.getByLabelText("Diego de Arce");
    // initialsFor takes the first letter of each whitespace-separated part,
    // joins them, slices to 2 chars, then uppercases. So "Diego de Arce"
    // becomes "DD".
    expect(initials).toHaveTextContent("DD");
  });

  it("extracts two uppercase letters from the first two name parts", () => {
    render(<CharacterPortrait assetId={undefined} name="Martin de Cuenca" />);
    expect(screen.getByLabelText("Martin de Cuenca")).toHaveTextContent("MD");
  });

  it("falls back to a single initial when the name has one part", () => {
    render(<CharacterPortrait assetId={undefined} name="Diego" />);
    expect(screen.getByLabelText("Diego")).toHaveTextContent("D");
  });

  it("applies the size in pixels to the wrapper", () => {
    const { container } = render(
      <CharacterPortrait assetId={undefined} name="Diego" size="lg" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("128px");
    expect(wrapper.style.height).toBe("128px");
  });

  it("applies the rounded=full class when requested", () => {
    const { container } = render(
      <CharacterPortrait assetId={undefined} name="Diego" rounded="full" />,
    );
    expect(container.firstElementChild).toHaveClass("rounded-full");
  });

  it("applies the xs rounded class by default", () => {
    const { container } = render(
      <CharacterPortrait assetId={undefined} name="Diego" />,
    );
    expect(container.firstElementChild).toHaveClass("rounded-xs");
  });

  it("renders the 'tu' player badge when withPlayerBadge=true", () => {
    render(
      <CharacterPortrait
        assetId={undefined}
        name="Diego"
        withPlayerBadge
      />,
    );
    expect(screen.getByText("tu")).toBeInTheDocument();
  });

  it("omits the player badge by default", () => {
    render(<CharacterPortrait assetId={undefined} name="Diego" />);
    expect(screen.queryByText("tu")).toBeNull();
  });

  it("uses a smaller badge text for xs/sm sizes", () => {
    const { rerender } = render(
      <CharacterPortrait assetId={undefined} name="Diego" size="xs" withPlayerBadge />,
    );
    expect(screen.getByText("tu")).toHaveClass("text-[7px]");
    rerender(
      <CharacterPortrait assetId={undefined} name="Diego" size="md" withPlayerBadge />,
    );
    expect(screen.getByText("tu")).toHaveClass("text-[8px]");
  });
});
