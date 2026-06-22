import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState", () => {
  it("renders the default title and description", () => {
    render(<ErrorState />);
    expect(screen.getByText("Algo ha fallado en el campamento")).toBeInTheDocument();
    expect(
      screen.getByText(/No hemos podido leer los datos del servidor/),
    ).toBeInTheDocument();
  });

  it("exposes a 'role=alert' container", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("renders the error message when given an Error instance", () => {
    render(<ErrorState error={new Error("HTTP 503")} />);
    expect(screen.getByText("HTTP 503")).toBeInTheDocument();
  });

  it("renders the error message when given a string", () => {
    render(<ErrorState error="Conexion rechazada" />);
    expect(screen.getByText("Conexion rechazada")).toBeInTheDocument();
  });

  it("renders a retry button when onRetry is provided", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: "Reintentar" });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when onRetry is missing", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses a custom retry label when provided", () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Probar de nuevo" />);
    expect(screen.getByRole("button", { name: "Probar de nuevo" })).toBeInTheDocument();
  });
});
