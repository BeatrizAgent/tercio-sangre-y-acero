extends Node

func resolve_mission(soldier: Dictionary, equipment_mods: Dictionary, mission: Dictionary, enemy: Dictionary) -> Dictionary:
	var stats: Dictionary = soldier.get("stats", {})
	var difficulty := int(mission.get("difficulty", 1))
	var enemy_power := int(enemy.get("power", 0))
	var pike_power := int(stats.get("pike", 0)) + int(equipment_mods.get("pike", 0))
	var sword_power := int(stats.get("sword", 0)) + int(equipment_mods.get("sword", 0))
	var ranged_power := int(stats.get("arquebus", 0)) + int(equipment_mods.get("arquebus", 0))
	var discipline := int(stats.get("discipline", 0)) + int(equipment_mods.get("discipline", 0))
	var vigor := int(stats.get("vigor", 0)) + int(equipment_mods.get("vigor", 0))
	var cunning := int(stats.get("cunning", 0)) + int(equipment_mods.get("cunning", 0))
	var score := pike_power + sword_power + ranged_power + discipline + vigor + cunning - floori(float(GameState.fatigue) / 10.0)
	var target := difficulty * 4 + enemy_power
	var success := score >= target
	var rewards: Dictionary = mission.get("rewards", {})
	var applied_rewards := {
		"coins": int(rewards.get("coins", 0)) if success else maxi(0, floori(float(int(rewards.get("coins", 0))) / 2.0)),
		"xp": int(rewards.get("xp", 0)),
		"honor": int(rewards.get("honor", 0)) if success else 0
	}
	var fatigue_gain := int(mission.get("fatigue", 5))
	var wounds: Array = []
	if not success or int(mission.get("wound_chance", 0)) + GameState.fatigue >= 35:
		wounds.append(mission.get("wound_id", "shallow_cut"))
	var loot: Array = _pick_loot(mission)

	GameState.add_coins(applied_rewards["coins"])
	SoldierManager.add_xp(applied_rewards["xp"])
	SoldierManager.add_honor(applied_rewards["honor"])
	SoldierManager.add_fatigue(fatigue_gain)
	for wound_id in wounds:
		SoldierManager.apply_wound(wound_id)
	for loot_row in loot:
		InventoryManager.add_item(loot_row.get("id", ""), int(loot_row.get("quantity", 1)))

	return {
		"ok": true,
		"success": success,
		"score": score,
		"target": target,
		"rewards": applied_rewards,
		"fatigue": fatigue_gain,
		"wounds": wounds,
		"loot": loot,
		"report_context": {
			"best_power": _best_power_name(pike_power, sword_power, ranged_power),
			"enemy": enemy.get("name", "the enemy")
		}
	}

func _pick_loot(mission: Dictionary) -> Array:
	var table_id: String = mission.get("loot_table", "")
	if table_id.is_empty():
		return []
	var tables: Variant = DataLoader.load_json("res://data/loot_tables.json", ["id", "drops"])
	if tables is Array:
		for table in tables:
			if table.get("id", "") == table_id:
				return table.get("drops", [])
	return []

func _best_power_name(pike_power: int, sword_power: int, ranged_power: int) -> String:
	if ranged_power >= pike_power and ranged_power >= sword_power:
		return "arquebus"
	if sword_power >= pike_power:
		return "sword"
	return "pike"
