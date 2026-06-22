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
      <div className="relative">
        <div className="mb-4 border-b border-iron pb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted">
            Archivo del Tercio · Informe #{report.id.slice(0, 8)}
          </p>
          <h1 className="font-cinzel text-2xl font-bold uppercase text-gold-soft">
            Diario de Campaña
          </h1>
        </div>

        <ReportStage report={report} mission={mission} />
      </div>
    </PageTransition>
  );
}
