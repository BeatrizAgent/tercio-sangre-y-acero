// InventoryPage: stub coming soon. Renders without errors.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import InventoryPage from "@/app/inventory/page";

describe("InventoryPage", () => {
  it("renders the coming-soon card", () => {
    render(<InventoryPage />);
    expect(screen.getByText("Inventario")).toBeInTheDocument();
  });

  it("shows a back link to /soldier", () => {
    render(<InventoryPage />);
    const link = screen.getByRole("link", { name: /Volver/ });
    expect(link).toHaveAttribute("href", "/soldier");
  });
});
