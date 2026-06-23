"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { Card } from "@/components/ui/card";
import { getMission } from "@/lib/game-data";
import { PageTransition } from "@/components/game/page-transition";
import { ReportDetailSkeleton } from "@/components/skeletons/report-detail-skeleton";
import { useGameData } from "@/lib/hooks/use-game-data";
import { ReportStage } from "./report-stage";

export default function ReportPage() {
  const params = useParams();
  const { status } = useGameData();
  const { reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const id = params.id as string;
  const report = reports.find((r) => r.id === id);

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <ReportDetailSkeleton />
      </PageTransition>
    );
  }

  if (!report) {
    return (
      <Card title="Informe No Encontrado">
        <p className="text-xs text-text-muted">
          El informe solicitado no existe o pertenece a otra campaña.
        </p>
        <Link
          href="/missions"
          className="mt-4 inline-block text-xs text-gold underline"
        >
          Volver a campana
        </Link>
      </Card>
    );
  }

  const mission = getMission(report.missionId);

  return (
    <PageTransition>
      <div className="relative space-y-4">
        <header className="page-header">
          <div>
            <p className="page-header__eyebrow">Archivo del Tercio · Informe #{report.id.slice(0, 8)}</p>
            <h1 className="page-header__title">Diario de campana</h1>
            <p className="page-header__subtitle">
              {mission ? mission.title : report.missionId.replace(/_/g, " ")}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
            report.success
              ? "border-success/45 bg-success/10 text-success"
              : "border-danger/45 bg-danger/10 text-danger"
          }`}>
            {report.success ? "Exito" : "Fracaso"}
          </span>
        </header>

        <ReportStage report={report} mission={mission} />
      </div>
    </PageTransition>
  );
}
