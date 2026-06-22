"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { DispatchSkeleton } from "@/components/skeletons/dispatch-skeleton";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";

export default function MailboxPage() {
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
        <DispatchSkeleton title="Buzon" rowCount={1} />
      </PageTransition>
    );
  }

  const letters = soldier.unpaidWages > 0
    ? [
        {
          title: "Aviso de soldada atrasada",
          seal: "Pagaduria del tercio",
          body: `Quedan ${soldier.unpaidWages} doblones pendientes en la cuenta de Diego de Arce.`,
        },
      ]
    : [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-iron pb-3">
          <UiAssetIcon id="mailbox" label="Buzon" className="h-14 w-14" />
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">BUZON</h1>
        </div>

        <Card title="Correo de campana" iconId="mailbox">
          <div className="space-y-3">
            {letters.length === 0 ? (
              <div className="border border-dashed border-iron p-6 text-center text-lg text-muted">
                Sin cartas nuevas.
              </div>
            ) : (
              letters.map((letter) => (
                <article key={letter.title} className="parchment-card p-5 text-stone-800">
                  <div className="mb-3 flex items-center gap-3 border-b border-parchment-dark/30 pb-3">
                    <UiAssetIcon id="mailbox" label={letter.title} className="h-9 w-9" />
                    <div>
                      <h2 className="font-serif text-xl font-bold">{letter.title}</h2>
                      <p className="font-mono text-xs uppercase tracking-wider text-stone-600">{letter.seal}</p>
                    </div>
                  </div>
                  <p className="font-serif text-lg leading-relaxed">{letter.body}</p>
                </article>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
