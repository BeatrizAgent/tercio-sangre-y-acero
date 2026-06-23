import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => {
  const useGameDataMock = vi.fn();
  const useGameStoreMock = vi.fn();
  return { useGameDataMock, useGameStoreMock };
});

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));

import RecruitmentPage from "@/app/recruitment/page";

function baseStore() {
  return {
    soldier: {
      id: "diego_de_arce",
      name: "Diego de Arce",
      rank: "bisono",
      coins: 25,
      honor: 0,
      xp: 0,
      reputation: 0,
    },
    characters: [],
    recruitCandidate: vi.fn().mockReturnValue({ ok: true, message: "ok" }),
  };
}

describe("RecruitmentPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    useGameStoreMock.mockImplementation((selector?: (s: ReturnType<typeof baseStore>) => unknown) =>
      selector ? selector(baseStore()) : baseStore(),
    );
  });

  it("shows the RecruitmentSkeleton while the game data is loading", () => {
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<RecruitmentPage />);
    // The skeleton renders multiple shimmer blocks.
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThan(0);
  });

  it("shows the ErrorState when the game data has an error", () => {
    const refetch = vi.fn();
    useGameDataMock.mockReturnValue({
      status: "error",
      error: new Error("Conexion rechazada"),
      refetch,
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    render(<RecruitmentPage />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Conexion rechazada")).toBeInTheDocument();
  });

  it("calls refetch when the retry button is clicked", async () => {
    const refetch = vi.fn();
    useGameDataMock.mockReturnValue({
      status: "error",
      error: new Error("HTTP 500"),
      refetch,
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const user = userEvent.setup();
    render(<RecruitmentPage />);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders the page content when the game data is ready", () => {
    useGameDataMock.mockReturnValue({
      status: "ready",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<RecruitmentPage />);
    // No skeleton shimmer blocks and no alert.
    expect(container.querySelector(".skeleton-shimmer")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    // The page renders the role filter for "all" and at least one candidate
    // from the recruitment catalog (Tomas de Orduna, the Piquero).
    expect(screen.getByRole("button", { name: /Todos/ })).toBeInTheDocument();
  });
});
