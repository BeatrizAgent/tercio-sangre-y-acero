import type { CombatResult } from "@/lib/combat/combat-types";

interface CombatLogProps {
  result: CombatResult;
}

export function CombatLog({ result }: CombatLogProps) {
  return (
    <aside className="border-t border-iron bg-stone-950/95 p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">Bitácora de campaña</p>
          <ol className="space-y-1 font-serif text-xs italic leading-relaxed text-text-muted">
            {result.log.slice(1).map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ol>
        </div>

        <div className="space-y-1 font-mono text-[10px] uppercase text-text-muted">
          <p className="tracking-[0.22em] text-muted">Modificadores</p>
          {result.modifiers.map((modifier) => (
            <div key={`${modifier.label}-${modifier.value}`} className="flex justify-between gap-3">
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
          <div>Doblones: <span className="text-gold">+{result.rewards.coins}</span></div>
          <div>Honor: <span className="text-gold">+{result.rewards.honor}</span></div>
          <div>XP: <span className="text-gold">+{result.rewards.xp}</span></div>
        </div>
      </div>
    </aside>
  );
}
