"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { DispatchSkeleton } from "@/components/skeletons/dispatch-skeleton";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { claimGameMessageAction, listGameMessagesAction, type GameMessageView } from "@/lib/actions/mailbox";
import { getItemImagePath } from "@/lib/game-data";

export default function MailboxPage() {
  const { status } = useGameData();
  const { soldier, hydrateState } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<GameMessageView[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshMessages = async () => {
    const result = await listGameMessagesAction();
    if (result.ok && result.data) setMessages(result.data.messages);
    else setNotice(result.message);
  };

  useEffect(() => {
    if (!mounted || status !== "ready") return;
    const timer = window.setTimeout(() => void refreshMessages(), 0);
    return () => window.clearTimeout(timer);
  }, [mounted, status]);

  const claimMessage = async (messageId: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await claimGameMessageAction({ messageId });
      setNotice(result.message);
      if (result.ok && result.data) hydrateState(result.data.state);
      await refreshMessages();
    } finally {
      setBusy(false);
    }
  };

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
          id: "wages",
          title: "Aviso de soldada atrasada",
          seal: "Pagaduria del tercio",
          body: `Quedan ${soldier.unpaidWages} doblones pendientes en la cuenta de Diego de Arce.`,
          claimLabel: null,
          claimedAt: null,
          itemId: null,
        },
      ]
    : [];
  const dbLetters = messages.map((message) => ({
    id: message.id,
    title: message.title,
    seal: message.kind.startsWith("auction") ? "Escribania de la lonja" : "Correo de campana",
    body: message.body,
    claimLabel: message.claimLabel,
    claimedAt: message.claimedAt,
    itemId: message.itemId,
  }));
  const allLetters = [...dbLetters, ...letters];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-iron pb-3">
          <UiAssetIcon id="mailbox" label="Buzon" className="h-14 w-14" />
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">BUZON</h1>
        </div>

        {notice && (
          <div role="status" className="notice notice--ok border border-iron bg-stone-900/60 p-2.5 font-mono text-xs">
            {notice}
          </div>
        )}

        <Card title="Correo de campana" iconId="mailbox">
          <div className="space-y-3">
            {allLetters.length === 0 ? (
              <div className="border border-dashed border-iron p-6 text-center text-lg text-muted">
                Sin cartas nuevas.
              </div>
            ) : (
              allLetters.map((letter) => (
                <article key={letter.id} className="parchment-card p-5 text-stone-800">
                  <div className="mb-3 flex items-center gap-3 border-b border-parchment-dark/30 pb-3">
                    {letter.itemId ? (
                      <img src={getItemImagePath(letter.itemId)} alt={letter.title} className="h-10 w-10 object-contain" />
                    ) : (
                      <UiAssetIcon id="mailbox" label={letter.title} className="h-9 w-9" />
                    )}
                    <div>
                      <h2 className="font-serif text-xl font-bold">{letter.title}</h2>
                      <p className="font-mono text-xs uppercase tracking-wider text-stone-600">{letter.seal}</p>
                    </div>
                  </div>
                  <p className="font-serif text-lg leading-relaxed">{letter.body}</p>
                  {letter.claimLabel && (
                    <button
                      type="button"
                      className="mt-4 border border-stone-700 bg-stone-800 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-parchment hover:bg-stone-700 disabled:opacity-60"
                      disabled={busy || Boolean(letter.claimedAt)}
                      onClick={() => void claimMessage(letter.id)}
                    >
                      {letter.claimedAt ? "Recogido" : letter.claimLabel}
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
