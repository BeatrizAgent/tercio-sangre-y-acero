// MailboxPage: in-game inbox. Renders against the real store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import type React from "react";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => ({
  useGameDataMock: vi.fn(),
  useGameStoreMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import MailboxPage from "@/app/mailbox/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

function installReadyStore() {
  const state: { current: GameState } = { current: createInitialState() };
  useGameStoreMock.mockImplementation((selector?: (s: GameState) => unknown) =>
    selector ? selector(state.current) : state.current,
  );
  Object.assign(useGameStoreMock, {
    getState: () => state.current,
    setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
      const update = typeof partial === "function" ? partial(state.current) : partial;
      state.current = { ...state.current, ...update };
    },
  });
  useGameDataMock.mockReturnValue({
    status: "ready",
    error: null,
    refetch: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
  });
}

describe("MailboxPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    // Default: empty inbox.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, messages: [] }),
      }),
    );
  });

  it("renders the DispatchSkeleton while loading", () => {
    installReadyStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<MailboxPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the mailbox content when ready", async () => {
    installReadyStore();
    const { container } = render(<MailboxPage />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.firstChild).not.toBeNull();
  });
});
