import type { CombatResult } from "@/lib/combat/combat-types";

interface CombatHudProps {
  result: CombatResult;
  missionTitle: string;
  ready: boolean;
  onContinue: () => void;
}

export function CombatHud({ result, missionTitle, ready, onContinue }: CombatHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      {ready && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] border border-gold/70 bg-stone-950/85 px-8 py-4 text-center shadow-2xl backdrop-blur-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted">Resultado</p>
          <p className={`mt-1 font-cinzel text-4xl font-bold uppercase tracking-[0.2em] ${result.success ? "text-gold" : "text-danger"}`}>
            {result.success ? "Éxito" : "Fallo"}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="max-w-[70%] border border-gold/30 bg-stone-950/75 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.22em] text-gold">Teatro de resolución</p>
          <h3 className="mt-1 line-clamp-2 font-cinzel text-sm uppercase tracking-wider text-gold-soft sm:text-base">
            {missionTitle}
          </h3>
        </div>

        <div className="border border-iron bg-stone-950/80 px-3 py-2 text-right font-mono text-[10px] uppercase text-text-muted">
          <div>
            Dado <span className="text-gold">+{result.roll}</span>
          </div>
          <div>
            Objetivo <span className="text-danger">{result.target}</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 p-3 sm:p-4">
        <div className="max-w-[58%] border border-iron bg-[rgba(20,15,11,0.82)] px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="font-serif text-xs italic leading-relaxed text-text">
            &quot;{result.log.at(-1) ?? "El humo decide lo que los hombres no alcanzan a ver."}&quot;
          </p>
        </div>

        {ready && (
          <button
            type="button"
            onClick={onContinue}
            className="pointer-events-auto border border-blood-bright bg-blood px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-text transition hover:bg-blood-bright hover:text-white"
          >
            Continuar al reporte
          </button>
        )}
      </div>
    </div>
  );
}
