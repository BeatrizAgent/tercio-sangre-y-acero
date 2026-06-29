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
        json: async () => ({
          ok: true,
          publicIp: "203.0.113.9",
          token: "tercio_abcdefghijklmnopqrstuvwxyzABCDEF",
        }),
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

  it("shows the detected public IP in the recovery panel", async () => {
    render(<LoginPage />);
    expect(await screen.findByText("203.0.113.9")).toBeInTheDocument();
  });

  it("suggests account names found for the detected public IP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          publicIp: "203.0.113.9",
          users: [
            { id: "user-1", name: "Diego de Arce" },
            { id: "user-2", name: "Alonso de Vera" },
          ],
        }),
      }),
    );

    render(<LoginPage />);

    expect(await screen.findByText("Soldados sugeridos por tu IP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diego de Arce" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alonso de Vera" })).toBeInTheDocument();
  });

  it("shows a copyable token after character creation", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText("Nombre"), "Alonso");
    await user.click(screen.getByRole("button", { name: "Crear personaje" }));
    expect(await screen.findByText("tercio_abcdefghijklmnopqrstuvwxyzABCDEF")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("uses carousel controls for portrait selection", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    expect(screen.getByText("1 / 16")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retrato siguiente" }));

    expect(screen.getByText("2 / 16")).toBeInTheDocument();
    expect(screen.getByText("Piquero veterano")).toBeInTheDocument();
  });

  it("requests account recovery by saved public IP and shows the new token", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, publicIp: "203.0.113.9" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          token: "tercio_recoveredabcdefghijklmnopqrstuvwxyz",
          user: { id: "user-1", name: "Diego de Arce" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: "Recuperar por IP" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/recover-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(await screen.findByText("tercio_recoveredabcdefghijklmnopqrstuvwxyz")).toBeInTheDocument();
  });

  it("lists public-IP recovery candidates when several characters share the IP", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, publicIp: "203.0.113.9" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          ok: false,
          error: "Hay varias cuentas en esta IP. Elige el soldado.",
          users: [
            { id: "user-1", name: "Diego de Arce" },
            { id: "user-2", name: "Alonso de Vera" },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          token: "tercio_candidateabcdefghijklmnopqrstuvwxyz",
          user: { id: "user-2", name: "Alonso de Vera" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: "Recuperar por IP" }));
    await user.click(await screen.findByRole("button", { name: "Alonso de Vera" }));

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/auth/recover-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alonso de Vera" }),
    });
    expect(await screen.findByText("tercio_candidateabcdefghijklmnopqrstuvwxyz")).toBeInTheDocument();
  });

  it("recovers a suggested account without typing the soldier name", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          publicIp: "203.0.113.9",
          users: [{ id: "user-1", name: "Diego de Arce" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          token: "tercio_suggestedabcdefghijklmnopqrstuvwxyz",
          user: { id: "user-1", name: "Diego de Arce" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);
    await user.click(await screen.findByRole("button", { name: "Diego de Arce" }));

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/recover-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Diego de Arce" }),
    });
    expect(await screen.findByText("tercio_suggestedabcdefghijklmnopqrstuvwxyz")).toBeInTheDocument();
  });

  it("falls back to a browser-visible public IP when the server cannot detect one", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: false, publicIp: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ip: "198.51.100.44" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);

    expect(await screen.findByText("198.51.100.44")).toBeInTheDocument();
    expect(screen.getByText("Vista por navegador")).toBeInTheDocument();
  });
});
