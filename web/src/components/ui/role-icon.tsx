// RoleIcon: maps a CharacterState role label to a Lucide icon.
// Single source of truth for the role -> icon mapping previously duplicated
// in stripe-card.tsx and stripe-token.tsx.

import {
  Axe,
  Crosshair,
  HeartHandshake,
  Swords,
  type LucideIcon,
} from "lucide-react";

const ROLE_ICON: Record<string, LucideIcon> = {
  Piquero: Swords,
  Tirador: Crosshair,
  Asistente: HeartHandshake,
  Jinete: Swords,
  Gastador: Axe,
};

export function roleIconFor(role: string | undefined): LucideIcon {
  if (!role) return Swords;
  return ROLE_ICON[role] ?? Swords;
}

export function RoleIcon({
  role,
  className = "h-3 w-3",
}: {
  role: string | undefined;
  className?: string;
}) {
  const Icon = roleIconFor(role);
  return <Icon className={className} aria-hidden="true" />;
}
