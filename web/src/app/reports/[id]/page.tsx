"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { Card } from "@/components/ui/card";
import { getMission } from "@/lib/game-data";
import { PageTransition } from "@/components/game/page-transition";
import { ReportStage } from "./report-stage";

export default function ReportPage() {
  const params = useParams();
  const { reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const id = params.id as string;
  const report = reports.find((r) => r.id === id);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent" />
          <p className="font-cinzel text-sm text-gold tracking-widest uppercase animate-pulse">
            Abriendo el archivo del escribano…
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <Card title="Informe No Encontrado">
        <p className="text-xs text-text-muted">
          El informe solicitado no existe o pertenece a otra campaña.
        </p>
        <Link
          href="/barracks"
          className="mt-4 inline-block text-xs text-gold underline"
        >
          Volver al cuartel
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
