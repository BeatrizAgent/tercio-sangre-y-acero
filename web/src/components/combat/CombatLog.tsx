import type { CombatEventLogEntry, CombatResult } from "@/lib/combat/combat-types";

interface CombatLogProps {
  result: CombatResult;
  elapsedMs: number;
  activeLogEntry?: CombatEventLogEntry;
}

const toneClass: Record<CombatEventLogEntry["tone"], string> = {
  neutral: "text-text-muted",
  danger: "text-danger",
  success: "text-success",
  reward: "text-gold",
};

export function CombatLog({ result, elapsedMs, activeLogEntry }: CombatLogProps) {
  const visibleEntries = result.eventLog.filter((entry) => entry.at <= elapsedMs);

  return (
    <aside className="border-t border-iron bg-stone-950/95 p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">Bitácora de campaña</p>
          <ol className="max-h-28 space-y-1 overflow-hidden font-serif text-xs italic leading-relaxed text-text-muted">
            {visibleEntries.map((entry) => {
              const active = entry.id === activeLogEntry?.id;
              return (
                <li
                  key={entry.id}
                  className={`border-l pl-2 transition-colors ${
                    active ? `border-gold bg-gold/5 ${toneClass[entry.tone]}` : "border-iron/60"
                  }`}
                >
                  {entry.text}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-1 font-mono text-[10px] uppercase text-text-muted">
          <p className="tracking-[0.22em] text-muted">Modificadores</p>
          {result.modifiers.map((modifier, index) => (
            <div key={`${modifier.label}-${modifier.value}-${index}`} className="flex justify-between gap-3">
              <span>{modifier.label}</span>
              <span className={modifier.value >= 0 ? "text-gold" : "text-danger"}>
                {modifier.value >= 0 ? "+" : ""}
                {modifier.value}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1 font-mono text-[10px] uppercase text-text-muted">
          <p className="tracking-[0.22em] text-muted">Resultado</p>
          <div className={result.success ? "text-success" : "text-danger"}>{result.success ? "Éxito" : "Fallo"}</div>
          <div>
            Doblones: <span className="text-gold">+{result.rewards.coins}</span>
          </div>
          <div>
            Honor: <span className="text-gold">+{result.rewards.honor}</span>
          </div>
          <div>
            XP: <span className="text-gold">+{result.rewards.xp}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
