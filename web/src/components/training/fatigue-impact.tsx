// FatigueImpact: shows the concrete penalty the current fatigue level
// imposes on training (XP gain and time), aligned with the rampa from
// the mockup (-18% XP, -8% tiempo cuando la fatiga supera 75).

"use client";

import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { fatigueImpact } from "@/lib/domain/training-preview";

const TONE: Record<ReturnType<typeof fatigueImpact>["label"], { bar: string; chip: string; eyebrow: string }> = {
  fresco: { bar: "bg-success", chip: "border-success/40 bg-success/12 text-success", eyebrow: "fresco" },
  cansado: { bar: "bg-ember", chip: "border-ember/45 bg-ember/12 text-ember", eyebrow: "cansado" },
  agotado: { bar: "bg-danger", chip: "border-danger/40 bg-danger/12 text-danger", eyebrow: "agotado" },
  roto: { bar: "bg-danger", chip: "border-danger/55 bg-danger/15 text-danger", eyebrow: "roto" },
};

export function FatigueImpact({ value }: { value: number }) {
  const impact = fatigueImpact(value);
  const tone = TONE[impact.label];
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="border border-iron bg-stone-950/65 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          <UiAssetIcon id="fatigue" label="Fatiga" className="h-4 w-4" />
          <span>Fatiga</span>
        </div>
        <span className={`rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${tone.chip}`}>
          {impact.label}
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 ring-1 ring-inset ring-iron/40">
          <div className={`h-full transition-all duration-300 ${tone.bar}`} style={{ width }} />
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
          <span>0</span>
          <span className={`${value > 75 ? "text-danger" : "text-text"} font-bold`}>{value} / 100</span>
          <span>100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <PenaltyTile
          label="XP"
          tone={impact.xpPenaltyPct > 0 ? "danger" : "success"}
          value={impact.xpPenaltyPct}
        />
        <PenaltyTile
          label="Tiempo"
          tone={impact.timePenaltyPct > 0 ? "danger" : "success"}
          value={impact.timePenaltyPct}
        />
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-text-muted">{impact.reason}</p>
    </div>
  );
}

function PenaltyTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "success";
  value: number;
}) {
  const border = tone === "danger" ? "border-danger/40" : "border-success/35";
  const text = tone === "danger" ? "text-danger" : "text-success";
  const display = value > 0 ? `-${value}%` : "ok";
  return (
    <div className={`border ${border} bg-stone-950/45 p-2 text-center`}>
      <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted">{label}</div>
      <div className={`font-cinzel text-lg font-extrabold ${text}`}>{display}</div>
    </div>
  );
}
