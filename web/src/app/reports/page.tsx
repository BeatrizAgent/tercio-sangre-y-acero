"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { ReportsSkeleton } from "@/components/skeletons/reports-skeleton";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";

export default function ReportsPage() {
  const { status } = useGameData();
  const { reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <ReportsSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="battleReports" label="Reportes" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Archivo del Tercio</p>
              <h1 className="page-header__title">Reportes</h1>
              <p className="page-header__subtitle">Diario de campana: cada informe cuenta lo que ya paso.</p>
            </div>
          </div>
          <span className="border border-iron bg-stone-900 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {reports.length} informe{reports.length === 1 ? "" : "s"}
          </span>
        </header>

        <Card title="Archivo de batallas" iconId="battleReports">
          {reports.length === 0 ? (
            <div className="border border-dashed border-iron p-6 text-center font-mono text-xs text-muted">
              Sin reportes de batalla. Vuelve cuando vuelvas del barro.
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.map((report) => (
                <li key={report.id}>
                  <Link
                    href={`/reports/${report.id}`}
                    className="flex items-start gap-3 border border-iron bg-panel/45 p-3 transition-all hover:border-gold/50 hover:bg-panel-raised"
                  >
                    <UiAssetIcon id="battleReports" label="Reporte" className="h-9 w-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-cinzel text-sm font-bold text-text">
                          {report.missionId.replace(/_/g, " ")}
                        </h2>
                        <Badge variant={report.success ? "success" : "danger"}>
                          {report.success ? "Exito" : "Fracaso"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">{report.report.split("\n")[0]}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
