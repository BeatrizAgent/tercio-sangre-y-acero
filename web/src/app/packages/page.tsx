"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";

export default function PackagesPage() {
  const { soldier } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">Revisando paquetes...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-iron pb-3">
          <UiAssetIcon id="packages" label="Paquetes" className="h-14 w-14" />
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">PAQUETES</h1>
        </div>

        <Card title="Recogida de paquetes" iconId="packages">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="border border-dashed border-iron p-6 text-lg text-muted">
              No hay paquetes pendientes para {soldier.name}.
            </div>
            <div className="grid gap-3">
              <Link href="/inventory" className="flex items-center gap-3 border border-iron p-3 font-cinzel font-bold text-text hover:border-gold/50 hover:text-gold">
                <UiAssetIcon id="inventory" label="Inventario" className="h-10 w-10" />
                Inventario
              </Link>
              <Link href="/armory" className="flex items-center gap-3 border border-iron p-3 font-cinzel font-bold text-text hover:border-gold/50 hover:text-gold">
                <UiAssetIcon id="armory" label="Armeria" className="h-10 w-10" />
                Armeria
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
