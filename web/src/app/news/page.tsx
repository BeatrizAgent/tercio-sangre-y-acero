"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { DispatchSkeleton } from "@/components/skeletons/dispatch-skeleton";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";

export default function NewsPage() {
  const { status } = useGameData();
  const { soldier } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <DispatchSkeleton title="Novedades" rowCount={2} />
      </PageTransition>
    );
  }

  const notices = [
    soldier.banMissionsLeft > 0
      ? `Destierro vigente: ${soldier.banMissionsLeft} turnos antes de volver a servicios locales.`
      : "El campamento mantiene servicios abiertos.",
    soldier.fatigue > 70
      ? "Fatiga alta: conviene descanso antes de otra salida."
      : "La tropa aguanta la marcha.",
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-iron pb-3">
          <UiAssetIcon id="news" label="Novedades" className="h-14 w-14" />
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">NOVEDADES</h1>
        </div>

        <Card title="Pregon del campamento" iconId="news">
          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice} className="flex items-start gap-3 border border-iron bg-panel/45 p-4">
                <UiAssetIcon id="news" label="Novedad" className="h-9 w-9" />
                <p className="text-lg text-text-muted">{notice}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
