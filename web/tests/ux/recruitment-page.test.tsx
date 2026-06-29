// RecruitmentPage: dense per-candidate card used by /recruitment. Renders
// against the real GameState store so the page exercises its full render
// path (filters, candidate cards, recruit action).

import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => {
  return { useGameDataMock: vi.fn(), useGameStoreMock: vi.fn() };
});

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));

// next/image fires onLoad in a useEffect so jsdom resolves the
// CharacterPortrait image-skeleton (added with the rival-card UX work)
// without triggering a setState-during-render warning.
vi.mock("next/image", () => {
  function MockImage({ onLoad, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
    useEffect(() => {
      if (typeof onLoad === "function") {
        onLoad({} as React.SyntheticEvent<HTMLImageElement>);
      }
    }, [onLoad]);
    return <img {...rest} alt={rest.alt ?? ""} />;
  }
  return {
    default: MockImage,
  };
});

import RecruitmentPage from "@/app/recruitment/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

// Real, in-memory store backing useGameStoreMock. The page reads from this
// store via the standard zustand `useGameStore(selector)` API.
function installRealStore(initial: GameState = createInitialState()) {
  const state: { current: GameState } = { current: initial };
  const listeners = new Set<() => void>();
  useGameStoreMock.mockImplementation((selector?: (s: GameState) => unknown) =>
    selector ? selector(state.current) : state.current,
  );
  Object.assign(useGameStoreMock, {
    getState: () => state.current,
    setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
      const update = typeof partial === "function" ? partial(state.current) : partial;
      state.current = { ...state.current, ...update };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  });
  return state;
}

describe("RecruitmentPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("shows the RecruitmentSkeleton while the game data is loading", () => {
    installRealStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<RecruitmentPage />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThan(0);
  });

  it("shows the ErrorState when the game data has an error", () => {
    installRealStore();
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
    installRealStore();
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

  it("renders the page content when the game data is ready", async () => {
    installRealStore();
    useGameDataMock.mockReturnValue({
      status: "ready",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<RecruitmentPage />);
    expect(await screen.findByRole("button", { name: /Todos/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector(".skeleton-shimmer")).toBeNull();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
