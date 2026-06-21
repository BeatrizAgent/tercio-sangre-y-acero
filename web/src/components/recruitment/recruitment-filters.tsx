// RecruitmentFilters: role filter buttons + sort select used at the top of
// /recruitment. Pure presentation; the page owns the state.

"use client";

import { useId } from "react";

export type SortMode = "power" | "cost" | "name";

export function RecruitmentFilters({
  roles,
  selectedRole,
  onSelectRole,
  sort,
  onSortChange,
  showRecruited,
  onToggleShowRecruited,
  totalCount,
  filteredCount,
}: {
  roles: readonly string[];
  selectedRole: string;
  onSelectRole: (role: string) => void;
  sort: SortMode;
  onSortChange: (mode: SortMode) => void;
  showRecruited: boolean;
  onToggleShowRecruited: (value: boolean) => void;
  totalCount: number;
  filteredCount: number;
}) {
  const sortId = useId();
  return (
    <div className="game-panel flex flex-col gap-2 rounded-xs border border-iron/70 bg-stone-950/55 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-iron/40 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Rol
          </span>
          <FilterChip
            label="Todos"
            active={selectedRole === "all"}
            onClick={() => onSelectRole("all")}
          />
          {roles.map((role) => (
            <FilterChip
              key={role}
              label={role}
              active={selectedRole === role}
              onClick={() => onSelectRole(role)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor={sortId}
            className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted"
          >
            Orden
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="cursor-pointer border border-iron bg-stone-900 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gold-soft outline-none transition hover:border-gold/40 focus:border-gold"
          >
            <option value="power">Potencia</option>
            <option value="cost">Coste (asc)</option>
            <option value="name">Nombre (A-Z)</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-text-muted">
        <span>
          Mostrando <span className="text-gold-soft">{filteredCount}</span> de{" "}
          <span className="text-gold-soft">{totalCount}</span> candidatos
        </span>
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showRecruited}
            onChange={(event) => onToggleShowRecruited(event.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-gold"
          />
          <span className="uppercase tracking-wider">Mostrar ya reclutados</span>
        </label>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? "border-gold/55 bg-gold/15 text-gold"
          : "border-iron/70 bg-stone-900/55 text-text-muted hover:border-gold/35 hover:text-gold-soft"
      }`}
    >
      {label}
    </button>
  );
}
