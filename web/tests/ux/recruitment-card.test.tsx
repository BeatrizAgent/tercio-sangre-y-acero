import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

vi.mock("next/image", () => {
  function MockImage({ onLoad, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
    useEffect(() => {
      if (typeof onLoad === "function") {
        onLoad({} as React.SyntheticEvent<HTMLImageElement>);
      }
    }, [onLoad]);
    return <img {...rest} alt={rest.alt ?? ""} />;
  }
  return { default: MockImage };
});

import { RecruitmentCard } from "@/components/recruitment/recruitment-card";
import type { RecruitmentCandidate } from "@/lib/data/recruitment";
import type { Soldier } from "@/lib/types";

function buildCandidate(overrides: Partial<RecruitmentCandidate> = {}): RecruitmentCandidate {
  return {
    id: "tomas_de_orduna",
    character: {
      id: "tomas_de_orduna",
      name: "Tomas de Orduna",
      role: "piquero",
      rank: "bisono",
      portraitAssetId: "portrait_tomas",
      stats: { pike: 4, sword: 2, arquebus: 1, discipline: 2, vigor: 3, cunning: 1, command: 0 },
      fatigue: 0,
    },
    cost: { coins: 15 },
    hook: "Cierra filas o muere en el intento.",
    ...overrides,
  } as RecruitmentCandidate;
}

function buildSoldier(): Soldier {
  return {
    id: "diego_de_arce",
    name: "Diego de Arce",
    rank: "bisono",
    coins: 25,
    honor: 0,
    xp: 0,
    reputation: 0,
  } as Soldier;
}

type ResizeObserverEntry = { contentRect: { width: number } };

class MockResizeObserver {
  private callback: (entries: ResizeObserverEntry[]) => void;

  constructor(callback: (entries: ResizeObserverEntry[]) => void) {
    this.callback = callback;
  }

  observe(target: Element) {
    const width = Number(
      (target as HTMLElement).dataset.mockWidth ??
        (target.parentElement as HTMLElement | null)?.dataset.mockWidth ??
        "0",
    );
    this.callback([{ contentRect: { width } }]);
  }

  disconnect() {}

  unobserve() {}
}

describe("RecruitmentCard compact mode", () => {
  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
      MockResizeObserver;
    if (typeof HTMLDialogElement !== "undefined") {
      HTMLDialogElement.prototype.showModal = function showModal() {
        (this as HTMLDialogElement & { open: boolean }).open = true;
      };
      HTMLDialogElement.prototype.close = function close() {
        (this as HTMLDialogElement & { open: boolean }).open = false;
      };
    }
  });

  afterEach(() => {
    delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it("marks the card as non-compact when the container is wider than 256px", () => {
    const { container } = render(
      <div style={{ width: "320px" }} data-mock-width="320">
        <RecruitmentCard
          candidate={buildCandidate()}
          soldier={buildSoldier()}
          recruited={false}
          onRecruit={vi.fn()}
        />
      </div>,
    );
    const card = container.querySelector('[data-testid="recruit-card-tomas_de_orduna"]');
    expect(card).toHaveAttribute("data-compact", "false");
    expect(card?.getAttribute("role")).toBeNull();
  });

  it("marks the card as compact and gives it a button role when the container is narrower than 256px", () => {
    const { container } = render(
      <div style={{ width: "200px" }} data-mock-width="200">
        <RecruitmentCard
          candidate={buildCandidate()}
          soldier={buildSoldier()}
          recruited={false}
          onRecruit={vi.fn()}
        />
      </div>,
    );
    const card = container.querySelector('[data-testid="recruit-card-tomas_de_orduna"]');
    expect(card).toHaveAttribute("data-compact", "true");
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveAttribute("aria-label", "Ver detalles y reclutar a Tomas de Orduna");
  });

  it("opens the stats popup when the compact card is activated via click or Enter", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div style={{ width: "200px" }} data-mock-width="200">
        <RecruitmentCard
          candidate={buildCandidate()}
          soldier={buildSoldier()}
          recruited={false}
          onRecruit={vi.fn()}
        />
      </div>,
    );
    const card = container.querySelector(
      '[data-testid="recruit-card-tomas_de_orduna"]',
    ) as HTMLElement;

    await user.click(card);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(card, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("exposes the recruit action inside the stats popup so it can be triggered from compact mode", async () => {
    const onRecruit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <div style={{ width: "200px" }} data-mock-width="200">
        <RecruitmentCard
          candidate={buildCandidate()}
          soldier={buildSoldier()}
          recruited={false}
          onRecruit={onRecruit}
        />
      </div>,
    );
    const card = container.querySelector(
      '[data-testid="recruit-card-tomas_de_orduna"]',
    ) as HTMLElement;

    await user.click(card);
    const dialog = screen.getByRole("dialog");
    const recruitButton = dialog.querySelector(
      "button:not([aria-label='Cerrar estadisticas'])",
    ) as HTMLButtonElement;
    await user.click(recruitButton);
    expect(onRecruit).toHaveBeenCalledOnce();
  });
});
