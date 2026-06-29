import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitBadge } from "@/components/ui/fit-badge";

describe("FitBadge", () => {
  it("matches the snapshot for encaja", () => {
    const { container } = render(<FitBadge fit="encaja" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders 'encaja' with a check icon", () => {
    render(<FitBadge fit="encaja" />);
    expect(screen.getByText("encaja")).toBeInTheDocument();
    expect(screen.getByLabelText("Encaja en la fila")).toBeInTheDocument();
  });

  it("uses gold styling for the player when encaja", () => {
    render(<FitBadge fit="encaja" isPlayer data-testid="badge" />);
    const span = screen.getByText("encaja");
    expect(span.parentElement).toHaveClass("border-gold/55");
  });

  it("uses success styling for non-player when encaja", () => {
    render(<FitBadge fit="encaja" data-testid="badge" />);
    const span = screen.getByText("encaja");
    expect(span.parentElement).toHaveClass("border-success/40");
  });

  it("renders 'fuera' for fuera_de_rol", () => {
    render(<FitBadge fit="fuera_de_rol" />);
    expect(screen.getByText("fuera")).toBeInTheDocument();
  });

  it("renders 'reserva' for banquillo", () => {
    render(<FitBadge fit="banquillo" />);
    expect(screen.getByText("reserva")).toBeInTheDocument();
  });
});
