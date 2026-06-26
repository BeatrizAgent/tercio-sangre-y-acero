import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
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
      fatigue: 12,
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

describe("RecruitmentCard", () => {
  it("renders candidate name, role, rank and quote correctly", () => {
    render(
      <RecruitmentCard
        candidate={buildCandidate()}
        soldier={buildSoldier()}
        recruited={false}
        onRecruit={vi.fn()}
      />
    );

    expect(screen.getByText("Tomas de Orduna")).toBeInTheDocument();
    expect(screen.getByText("piquero")).toBeInTheDocument();
    expect(screen.getByText(/Cierra filas o muere en el intento/i)).toBeInTheDocument();
  });

  it("renders all 7 attributes and the power sum correctly", () => {
    render(
      <RecruitmentCard
        candidate={buildCandidate()}
        soldier={buildSoldier()}
        recruited={false}
        onRecruit={vi.fn()}
      />
    );

    // Stats values: pike(4), sword(2), arquebus(1), discipline(2), vigor(3), cunning(1), command(0)
    expect(screen.getByText("Pic")).toBeInTheDocument();
    expect(screen.getByText("Esp")).toBeInTheDocument();
    expect(screen.getByText("Arc")).toBeInTheDocument();
    expect(screen.getByText("Dis")).toBeInTheDocument();
    expect(screen.getByText("Vig")).toBeInTheDocument();
    expect(screen.getByText("Ast")).toBeInTheDocument();
    expect(screen.getByText("Man")).toBeInTheDocument();

    // Sum of stats is 4 + 2 + 1 + 2 + 3 + 1 + 0 = 13
    expect(screen.getByText("13")).toBeInTheDocument();
  });

  it("triggers onRecruit callback when clicking the recruit button", async () => {
    const onRecruit = vi.fn();
    const user = userEvent.setup();
    render(
      <RecruitmentCard
        candidate={buildCandidate()}
        soldier={buildSoldier()}
        recruited={false}
        onRecruit={onRecruit}
      />
    );

    const button = screen.getByRole("button", { name: /Reclutar a Tomas de Orduna por 15 doblones/i });
    await user.click(button);
    expect(onRecruit).toHaveBeenCalledOnce();
  });
});
