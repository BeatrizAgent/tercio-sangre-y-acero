"use client";

import type { MissionDefinition, Soldier } from "@/lib/types";
import { CombatResolutionModal } from "@/components/combat/CombatResolutionModal";
import { buildCombatResult } from "@/lib/combat/combat-resolver";

interface MissionCanvasResolverProps {
  mission: MissionDefinition;
  soldier: Soldier;
  onComplete: (success: boolean) => void;
}

export function MissionCanvasResolver({ mission, soldier, onComplete }: MissionCanvasResolverProps) {
  const result = buildCombatResult(mission, soldier);

  const finish = () => {
    onComplete(result.success);
  };

  return (
    <CombatResolutionModal
      open
      missionTitle={mission.title}
      missionId={mission.id}
      result={result}
      onClose={finish}
      onContinue={finish}
    />
  );
}
