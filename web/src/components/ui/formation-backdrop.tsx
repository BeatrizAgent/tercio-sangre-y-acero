// FormationBackdrop: the painted field + corner art + smoke/mud decoration
// used by both tercio-battle-line.tsx and tercio-formation-view.tsx.
// Centralizes the visual "camp scene" so the two views stay in sync.

"use client";

import React from "react";
import Image from "next/image";

export const FORMATION_FIELD_BG =
  "/assets/generated/scenes/tercio_formation_field_v01.png";

const UI_ART = {
  smoke: "/assets/gpt-bank/ui/icons/humo_negro_transparente.png",
  mud: "/assets/gpt-bank/ui/icons/salpicadura_barro_transparente.png",
  cornerTopLeft: "/assets/gpt-bank/ui/icons/esquina_marco_dorada_superior_izquierda.png",
  cornerTopRight: "/assets/gpt-bank/ui/icons/esquina_marco_dorada_superior_derecha.png",
  cornerBottomLeft: "/assets/gpt-bank/ui/icons/esquina_marco_dorada_inferior_izquierda.png",
  cornerBottomRight: "/assets/gpt-bank/ui/icons/esquina_marco_dorada_inferior_derecha.png",
  banner: "/assets/gpt-bank/ui/icons/estandarte_cruz_roja_colgante.png",
} as const;

export function FormationField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url("${FORMATION_FIELD_BG}")` }}
    />
  );
}

export function CampBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute bottom-5 left-10 z-10 h-5 w-16 -rotate-6 rounded-[50%] bg-stone-200/25" />
      <div className="pointer-events-none absolute bottom-12 right-16 z-10 h-4 w-12 rotate-12 rounded-[50%] bg-stone-200/20" />
      <div className="pointer-events-none absolute left-[28%] top-[26%] z-10 h-3 w-24 rounded-full bg-stone-950/18 blur-sm" />
      <div className="pointer-events-none absolute right-[22%] top-[35%] z-10 h-3 w-28 rounded-full bg-stone-950/16 blur-sm" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, transparent 0%, rgba(0,0,0,0.06) 55%, rgba(0,0,0,0.34) 100%)",
        }}
      />
    </>
  );
}

export function UiArtFrame() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 bg-stone-950/10" />
      <Image
        src={UI_ART.smoke}
        alt=""
        width={640}
        height={640}
        aria-hidden="true"
        className="pointer-events-none absolute left-[16%] top-[10%] z-20 h-56 w-56 opacity-[0.10] mix-blend-multiply"
      />
      <Image
        src={UI_ART.mud}
        alt=""
        width={320}
        height={320}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-[16%] z-20 h-32 w-32 opacity-[0.18] mix-blend-multiply"
      />
      <Image
        src={UI_ART.banner}
        alt=""
        width={160}
        height={220}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-[17%] z-20 hidden h-24 w-16 opacity-80 drop-shadow-lg md:block"
      />
      <Image
        src={UI_ART.cornerTopLeft}
        alt=""
        width={96}
        height={96}
        aria-hidden="true"
        className="pointer-events-none absolute left-1 top-1 z-30 h-10 w-10 opacity-70"
      />
      <Image
        src={UI_ART.cornerTopRight}
        alt=""
        width={96}
        height={96}
        aria-hidden="true"
        className="pointer-events-none absolute right-1 top-1 z-30 h-10 w-10 opacity-70"
      />
      <Image
        src={UI_ART.cornerBottomLeft}
        alt=""
        width={96}
        height={96}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 z-30 h-10 w-10 opacity-55"
      />
      <Image
        src={UI_ART.cornerBottomRight}
        alt=""
        width={96}
        height={96}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 right-1 z-30 h-10 w-10 opacity-55"
      />
    </>
  );
}

// Composition: drop-in replacement for the two backgrounds previously
// inlined in tercio-battle-line.tsx and tercio-formation-view.tsx.
export function FormationBackdrop({ withFrame = true }: { withFrame?: boolean }) {
  return (
    <>
      <FormationField />
      {withFrame && <UiArtFrame />}
      <CampBackdrop />
    </>
  );
}
