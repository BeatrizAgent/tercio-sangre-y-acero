"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";

export default function ReportsPage() {
  const { reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">Archivando reportes...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-iron pb-3">
          <UiAssetIcon id="battleReports" label="Reportes" className="h-14 w-14" />
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">REPORTES</h1>
        </div>

        <Card title="Archivo de batallas" iconId="battleReports">
          {reports.length === 0 ? (
            <div className="border border-dashed border-iron p-6 text-center text-lg text-muted">
              Sin reportes de batalla.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="block border border-iron bg-panel/45 p-4 transition-all hover:border-gold/50 hover:bg-panel-raised"
                >
                  <div className="flex items-start gap-3">
                    <UiAssetIcon id="battleReports" label="Reporte" className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-cinzel text-lg font-bold text-text">
                          {report.missionId.replace(/_/g, " ")}
                        </h2>
                        <Badge variant={report.success ? "success" : "danger"}>
                          {report.success ? "Exito" : "Fracaso"}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-text-muted">{report.report.split("\n")[0]}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
