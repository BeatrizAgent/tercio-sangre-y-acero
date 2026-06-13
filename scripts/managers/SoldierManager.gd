extends Node

var soldier: Dictionary = {
	"id": "diego_de_arce",
	"name": "Diego de Arce",
	"rank_id": "bisono",
	"wounds": [],
	"stats": {
		"pike": 2,
		"sword": 1,
		"arquebus": 1,
		"discipline": 2,
		"vigor": 2,
		"cunning": 1,
		"command": 0
	}
}

func get_soldier() -> Dictionary:
	soldier["rank_id"] = GameState.rank_id
	return soldier

func get_stat(stat_id: String) -> int:
	return int(soldier.get("stats", {}).get(stat_id, 0))

func add_xp(amount: int) -> void:
	GameState.add_xp(amount)
	_update_rank()

func add_honor(amount: int) -> void:
	GameState.add_honor(amount)
	_update_rank()

func add_fatigue(amount: int) -> void:
	GameState.add_fatigue(amount)

func add_stat(stat_id: String, amount: int) -> void:
	var stats: Dictionary = soldier.get("stats", {})
	stats[stat_id] = max(0, int(stats.get(stat_id, 0)) + amount)
	soldier["stats"] = stats

func can_pay_training(training_row: Dictionary) -> bool:
	var cost: Dictionary = training_row.get("cost", {})
	return GameState.coins >= int(cost.get("coins", 0)) and GameState.xp >= int(cost.get("xp", 0))

func pay_training(training_row: Dictionary) -> bool:
	if not can_pay_training(training_row):
		return false
	var cost: Dictionary = training_row.get("cost", {})
	GameState.add_coins(-int(cost.get("coins", 0)))
	GameState.add_xp(-int(cost.get("xp", 0)))
	return true

func apply_wound(wound_id: String) -> bool:
	if not WoundManager.has_wound(wound_id):
		return false
	var wounds: Array = soldier.get("wounds", [])
	if not wounds.has(wound_id):
		wounds.append(wound_id)
		soldier["wounds"] = wounds
		GameState.log_event("%s suffered %s." % [soldier.get("name", "Soldier"), WoundManager.get_wound(wound_id).get("name", wound_id)])
	return true

func remove_wound(wound_id: String) -> bool:
	var wounds: Array = soldier.get("wounds", [])
	var removed := wounds.has(wound_id)
	wounds.erase(wound_id)
	soldier["wounds"] = wounds
	return removed

func treat_first_wound() -> bool:
	var wounds: Array = soldier.get("wounds", [])
	if wounds.is_empty():
		return false
	return remove_wound(wounds[0])

func get_rank_name() -> String:
	var rows: Variant = DataLoader.load_json("res://data/ranks.json", ["id", "name", "min_xp", "min_honor"])
	if rows is Array:
		for row in rows:
			if row.get("id", "") == GameState.rank_id:
				return row.get("name", GameState.rank_id)
	return GameState.rank_id

func _update_rank() -> void:
	var rows: Variant = DataLoader.load_json("res://data/ranks.json", ["id", "name", "min_xp", "min_honor"])
	if not rows is Array:
		return
	var best := GameState.rank_id
	for row in rows:
		if GameState.xp >= int(row.get("min_xp", 0)) and GameState.honor >= int(row.get("min_honor", 0)):
			best = row.get("id", best)
	GameState.rank_id = best
	soldier["rank_id"] = best
