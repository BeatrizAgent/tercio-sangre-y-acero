// StubComingSoon: a small Card-based "en construccion" panel for routes
// that exist for navigation but do not yet have a full implementation.
// Used by the inventory, equipment, and city/church placeholder pages.

"use client";

import Link from "next/link";
import { Construction } from "lucide-react";
import { Card } from "./card";
import { UiAssetIcon } from "./ui-asset-icon";
import { PageTransition } from "@/components/game/page-transition";
import type { ComponentProps } from "react";

type UiIconId = ComponentProps<typeof UiAssetIcon>["id"];

export function StubComingSoon({
  title,
  description,
  icon,
  backHref = "/city",
  backLabel = "Volver a la ciudad",
}: {
  title: string;
  description: string;
  icon?: UiIconId;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <PageTransition>
      <Card title={title} iconId={icon}>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xs border border-warning/45 bg-warning/10 text-warning">
            <Construction className="h-9 w-9" aria-hidden="true" />
          </div>
          <p className="max-w-md text-sm font-serif italic leading-relaxed text-text-muted">
            {description}
          </p>
          <span className="border border-warning/35 bg-warning/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-warning">
            En construccion
          </span>
          <Link
            href={backHref}
            className="iron-button mt-2 inline-flex items-center gap-2 text-xs"
          >
            {backLabel}
          </Link>
        </div>
      </Card>
    </PageTransition>
  );
}
