// EquipmentPage: stub coming soon. Renders without errors.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import EquipmentPage from "@/app/equipment/page";

describe("EquipmentPage", () => {
  it("renders the coming-soon card", () => {
    render(<EquipmentPage />);
    expect(screen.getByText("Equipo")).toBeInTheDocument();
  });

  it("shows a back link to /soldier", () => {
    render(<EquipmentPage />);
    const link = screen.getByRole("link", { name: /Volver/ });
    expect(link).toHaveAttribute("href", "/soldier");
  });
});
