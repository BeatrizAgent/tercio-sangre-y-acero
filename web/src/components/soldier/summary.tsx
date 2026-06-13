import { Badge, Card } from "@/components/ui/card";
import { getItem, getRankName, getWound } from "@/lib/game-data";
import type { Soldier } from "@/lib/types";

export function SoldierSummary({ soldier }: { soldier: Soldier }) {
  return (
    <Card title="Soldier Profile">
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-2xl font-semibold">{soldier.name}</h3>
          <p className="text-stone-400">Rank: {getRankName(soldier.rank)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>Coins {soldier.coins}</Badge>
            <Badge>Honor {soldier.honor}</Badge>
            <Badge>XP {soldier.xp}</Badge>
            <Badge>Fatigue {soldier.fatigue}</Badge>
            <Badge>Unpaid wages {soldier.unpaidWages}</Badge>
          </div>
        </div>
        <div className="space-y-2 text-sm text-stone-300">
          {Object.entries(soldier.stats).map(([stat, value]) => (
            <div className="flex justify-between border-b border-stone-800 pb-1" key={stat}>
              <span>{stat}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-semibold">Equipment</h4>
          <ul className="space-y-1 text-sm text-stone-300">
            {Object.entries(soldier.equipment).map(([slot, itemId]) => (
              <li className="flex justify-between border-b border-stone-800 pb-1" key={slot}>
                <span>{slot}</span>
                <span>{itemId ? getItem(itemId)?.name ?? itemId : "-"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Wounds</h4>
          {soldier.wounds.length === 0 ? (
            <p className="text-sm text-stone-400">No active wounds.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-300">
              {soldier.wounds.map((wound) => (
                <li key={wound.id}>
                  {getWound(wound.woundId)?.name ?? wound.woundId}
                  {wound.treated ? " (treated)" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
