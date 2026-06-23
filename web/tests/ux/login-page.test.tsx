import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

const replace = vi.fn();
const writeText = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    replace.mockReset();
    window.history.replaceState({}, "", "/login");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, token: "tercio_abcdefghijklmnopqrstuvwxyzABCDEF" }),
      }),
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    writeText.mockClear();
  });

  it("renders create and recovery forms", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Entra al tercio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear personaje" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recuperar por IP" })).toBeInTheDocument();
  });

  it("shows a missing-session notice when redirected without a cookie", async () => {
    window.history.replaceState({}, "", "/login?reason=missing-session");
    render(<LoginPage />);
    expect(await screen.findByText(/Sesion cerrada/)).toBeInTheDocument();
  });

  it("shows a copyable token after character creation", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText("Nombre"), "Alonso");
    await user.click(screen.getByRole("button", { name: "Crear personaje" }));
    expect(await screen.findByText("tercio_abcdefghijklmnopqrstuvwxyzABCDEF")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("requests account recovery by saved public IP and shows the new token", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: "tercio_recoveredabcdefghijklmnopqrstuvwxyz" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);
    await user.type(screen.getByLabelText("Nombre del soldado"), "Diego de Arce");
    await user.click(screen.getByRole("button", { name: "Recuperar por IP" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/recover-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Diego de Arce" }),
    });
    expect(await screen.findByText("tercio_recoveredabcdefghijklmnopqrstuvwxyz")).toBeInTheDocument();
  });
});
