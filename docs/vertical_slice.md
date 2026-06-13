# Vertical Slice

The first playable web slice is a desktop-first browser MVP.

## MVP Loop

Barracks -> train stat -> buy item -> equip item -> choose mission -> resolve mission -> show report -> apply rewards/wounds/fatigue -> return to barracks.

## Routes

- `/barracks`: soldier dashboard.
- `/training`: train one stat.
- `/armory`: buy and sell items.
- `/inventory`: list owned items.
- `/equipment`: equip owned gear.
- `/missions`: list missions.
- `/missions/[id]`: resolve mission.
- `/reports/[id]`: read report.
- `/hospital`: treat wounds.

## Excluded From MVP

No auth, PvP, companies/guilds, canvas, tactical combat, open-world exploration, market, rankings, or admin tools.
