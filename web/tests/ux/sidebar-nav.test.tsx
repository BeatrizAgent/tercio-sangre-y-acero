import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock, searchParamsMock, useGameStoreMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  searchParamsMock: vi.fn(),
  useGameStoreMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useSearchParams: searchParamsMock,
}));

vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("@/lib/sounds", () => ({ playPageSound: vi.fn() }));

import { SidebarNav } from "@/components/game/sidebar-nav";
import { createInitialState } from "@/lib/domain/initial-state";

function installStore() {
  const state = createInitialState();
  useGameStoreMock.mockReturnValue({
    soldier: state.soldier,
    storyProgress: state.storyProgress,
  });
  Object.assign(useGameStoreMock, {
    getState: () => state,
  });
}

describe("SidebarNav", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    searchParamsMock.mockReset();
    useGameStoreMock.mockReset();
    installStore();
  });

  it("shows campaign and story tabs in the campaign sidebar section", async () => {
    pathnameMock.mockReturnValue("/missions");
    searchParamsMock.mockReturnValue(new URLSearchParams(""));

    render(<SidebarNav />);

    expect(await screen.findByRole("tab", { name: /Campaña/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Historia/ })).toHaveAttribute("href", "/missions?mode=story");
    expect(screen.getByRole("link", { name: /Flandes/ })).toHaveAttribute("href", "/missions?region=flandes");
  });

  it("activates story mode and shows five story acts instead of regions", async () => {
    pathnameMock.mockReturnValue("/missions");
    searchParamsMock.mockReturnValue(new URLSearchParams("mode=story"));

    render(<SidebarNav />);

    expect(await screen.findByRole("tab", { name: /Historia/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Campaña/ })).toHaveAttribute("href", "/missions");
    expect(screen.queryByRole("link", { name: /Flandes/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Acto \d/ })).toHaveLength(5);
    expect(screen.getByTitle("Acto 1")).toHaveClass("active");
  });
});
