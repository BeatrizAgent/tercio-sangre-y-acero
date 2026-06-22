"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { ResourceChip } from "@/components/ui/resource-chip";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { RecruitmentCard } from "@/components/recruitment/recruitment-card";
import { RecruitmentSkeleton } from "@/components/skeletons/recruitment-skeleton";
import {
  RecruitmentFilters,
  type SortMode,
} from "@/components/recruitment/recruitment-filters";
import {
  candidateAffordability,
  filterCandidatesByRole,
  recruitmentCandidates,
  sortCandidates,
  uniqueRolesFromCandidates,
} from "@/lib/data/recruitment";
import { featuredAssetPaths } from "@/lib/data/ui-paths";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { playCoinSound, playPageSound } from "@/lib/sounds";

type Notice = { kind: "ok" | "err"; title: string; detail: string };

const ALL_ROLES = "all";

export default function RecruitmentPage() {
  const { status, error, refetch } = useGameData();
  const soldier = useGameStore((state) => state.soldier);
  const characters = useGameStore((state) => state.characters);
  const recruitCandidate = useGameStore((state) => state.recruitCandidate);

  const [role, setRole] = useState<string>(ALL_ROLES);
  const [sort, setSort] = useState<SortMode>("power");
  const [showRecruited, setShowRecruited] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const recruitedIds = useMemo(
    () => new Set(characters.map((character) => character.id)),
    [characters],
  );

  const available = useMemo(
    () => recruitmentCandidates.filter((candidate) => !recruitedIds.has(candidate.character.id)),
    [recruitedIds],
  );

  const roles = useMemo(() => uniqueRolesFromCandidates(recruitmentCandidates), []);

  const visible = useMemo(() => {
    const filtered = showRecruited
      ? recruitmentCandidates
      : recruitmentCandidates.filter((candidate) => !recruitedIds.has(candidate.character.id));
    return sortCandidates(filterCandidatesByRole(filtered, role), sort);
  }, [recruitedIds, role, sort, showRecruited]);

  const resourcesTone = useMemo(() => {
    if (available.length === 0) {
      return { coins: "text-text-muted", honor: "text-text-muted", rank: "text-text-muted" } as const;
    }
    const affordCount = available.filter((c) => candidateAffordability(soldier, c).canAfford).length;
    if (affordCount === 0) {
      return { coins: "text-danger", honor: "text-danger", rank: "text-danger" } as const;
    }
    if (affordCount === available.length) {
      return { coins: "text-gold", honor: "text-gold", rank: "text-gold" } as const;
    }
    return { coins: "text-ember", honor: "text-ember", rank: "text-ember" } as const;
  }, [available, soldier]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function handleRecruit(candidate: (typeof recruitmentCandidates)[number]) {
    const result = recruitCandidate(candidate.id);
    if (result.ok) {
      playCoinSound();
      const parts: string[] = [];
      if (candidate.cost.coins) parts.push(`−${candidate.cost.coins} doblones`);
      if (candidate.cost.honor) parts.push(`−${candidate.cost.honor} honor`);
      if (candidate.cost.reputation) parts.push(`−${candidate.cost.reputation} fama`);
      setNotice({
        kind: "ok",
        title: `${candidate.character.name} entró al banquillo.`,
        detail: parts.join(" · ") || "Sin coste",
      });
    } else {
      playPageSound();
      setNotice({ kind: "err", title: "No se pudo reclutar", detail: result.message });
    }
  }

  if (status === "error") {
    return (
      <PageTransition>
        <ErrorState error={error} onRetry={refetch} />
      </PageTransition>
    );
  }

  if (status !== "ready") {
    return (
      <PageTransition>
        <RecruitmentSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {notice && <NoticeBanner notice={notice} />}

        <section className="scene-frame relative overflow-hidden rounded-xs border border-iron bg-stone-950">
          <img
            src={featuredAssetPaths.barracks}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-75"
            draggable={false}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-background/35" />
          <div className="relative z-10 grid gap-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xs border border-gold/35 bg-background/80 shadow-inner">
                <UiAssetIcon id="cityHouseOfTrade" label="Reclutamiento" className="h-8 w-8" />
              </span>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gold-soft/80">
                  Plaza de enganche
                </p>
                <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-[0.14em] text-gold md:text-3xl">
                  Reclutamiento
                </h1>
                <p className="mt-1 max-w-md text-xs leading-snug text-text-muted">
                  Veteranos y bisonos buscan capitan con honra o bolsa. Cada recluta
                  entra al banquillo: sácalo de reserva para llevarlo a mision.
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              <div className="grid grid-cols-3 gap-2">
                <ResourceChip
                  icon="coins"
                  label="Doblones"
                  value={soldier.coins}
                  tone={resourcesTone.coins}
                />
                <ResourceChip
                  icon="honor"
                  label="Honor"
                  value={soldier.honor}
                  tone={resourcesTone.honor}
                />
                <ResourceChip
                  icon="rank"
                  label="Fama"
                  value={soldier.reputation}
                  tone={resourcesTone.rank}
                />
              </div>
              <div className="border border-gold/35 bg-background/75 px-3 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gold-soft">
                {recruitedIds.size} / {recruitmentCandidates.length} en el tercio
              </div>
            </div>
          </div>
        </section>

        <RecruitmentFilters
          roles={roles}
          selectedRole={role}
          onSelectRole={setRole}
          sort={sort}
          onSortChange={setSort}
          showRecruited={showRecruited}
          onToggleShowRecruited={setShowRecruited}
          totalCount={recruitmentCandidates.length}
          filteredCount={visible.length}
        />

        {visible.length === 0 ? (
          <CandidatesEmptyState
            hasAnyRecruits={recruitedIds.size > 0}
            showRecruited={showRecruited}
            onToggleShowRecruited={setShowRecruited}
          />
        ) : (
          <section
            className="deferred-section grid gap-3 lg:grid-cols-2 2xl:grid-cols-3"
            style={{ containIntrinsicSize: "auto 1200px" }}
          >
            {visible.map((candidate) => (
              <RecruitmentCard
                key={candidate.id}
                candidate={candidate}
                soldier={soldier}
                recruited={recruitedIds.has(candidate.character.id)}
                onRecruit={() => handleRecruit(candidate)}
              />
            ))}
          </section>
        )}
      </div>
    </PageTransition>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  const ok = notice.kind === "ok";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 border px-3 py-2 font-mono text-xs ${
        ok
          ? "border-success/45 bg-success/10 text-success"
          : "border-danger/45 bg-danger/10 text-danger"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border ${
          ok ? "border-success/55 bg-success/15" : "border-danger/55 bg-danger/15"
        }`}
      >
        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0">
        <p className="font-bold uppercase tracking-wider">{notice.title}</p>
        {notice.detail && (
          <p className="mt-0.5 text-[11px] tracking-wide text-text-muted">{notice.detail}</p>
        )}
      </div>
    </div>
  );
}

function CandidatesEmptyState({
  hasAnyRecruits,
  showRecruited,
  onToggleShowRecruited,
}: {
  hasAnyRecruits: boolean;
  showRecruited: boolean;
  onToggleShowRecruited: (value: boolean) => void;
}) {
  if (!hasAnyRecruits) {
    return (
      <EmptyState
        title="Nadie se ha presentado hoy"
        description="Vuelve mañana, o prueba a cambiar el filtro de rol."
      />
    );
  }
  return (
    <EmptyState
      title="Todos los candidatos visibles ya estan en tu tercio"
      action={
        !showRecruited ? (
          <button
            type="button"
            onClick={() => onToggleShowRecruited(true)}
            className="cursor-pointer border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-gold-soft transition hover:bg-gold/20"
          >
            Mostrar ya reclutados
          </button>
        ) : null
      }
    />
  );
}
