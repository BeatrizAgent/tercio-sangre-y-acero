import Link from "next/link";
import type React from "react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";

type PlaceIcon = React.ComponentProps<typeof UiAssetIcon>["id"];

interface CityPlacePageProps {
  title: string;
  eyebrow: string;
  icon: PlaceIcon;
  description: string;
  quote: string;
}

export function CityPlacePage({ title, eyebrow, icon, description, quote }: CityPlacePageProps) {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[62vh] max-w-4xl items-center">
        <section className="game-panel w-full p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="asset-icon-frame flex h-32 w-32 shrink-0 items-center justify-center rounded-sm">
              <UiAssetIcon id={icon} label={title} className="h-28 w-28" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-cinzel text-sm font-bold uppercase tracking-[0.22em] text-gold-soft">{eyebrow}</p>
              <h1 className="mt-2 font-blackletter text-6xl font-extrabold leading-none text-gold md:text-7xl">
                {title}
              </h1>
              <p className="mt-5 text-xl leading-relaxed text-text-muted">{description}</p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="border border-warning/35 bg-warning/10 px-3 py-2 font-mono text-sm font-bold uppercase tracking-wider text-warning">
                  Proximamente
                </span>
                <Link href="/city" className="iron-button inline-flex items-center gap-3">
                  <UiAssetIcon id="city" label="Ciudad" className="h-8 w-8" />
                  Volver a la ciudad
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
