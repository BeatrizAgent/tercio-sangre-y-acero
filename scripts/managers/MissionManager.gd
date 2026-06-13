extends Node

var missions: Dictionary = {}

func _ready() -> void:
	load_missions()

func load_missions() -> void:
	missions.clear()
	var rows: Variant = DataLoader.load_json("res://data/missions.json", ["id", "title", "type", "difficulty", "enemy_id", "rewards", "fatigue", "wound_chance", "report_tags"])
	if rows is Array:
		for row in rows:
			missions[row["id"]] = row

func get_missions() -> Array:
	return missions.values()

func get_mission(mission_id: String) -> Dictionary:
	return missions.get(mission_id, {})

func start_mission(mission_id: String) -> Dictionary:
	var mission := get_mission(mission_id)
	if mission.is_empty():
		return {"ok": false, "message": "Unknown mission."}
	var enemy := _get_enemy(mission.get("enemy_id", ""))
	var result := CombatResolver.resolve_mission(SoldierManager.get_soldier(), EquipmentManager.get_equipment_modifiers(), mission, enemy)
	var report := ReportGenerator.generate_mission_report(result, mission, SoldierManager.get_soldier())
	result["report"] = report
	GameState.last_report = result
	GameState.log_event("Mission resolved: %s." % mission.get("title", mission_id))
	return result

func _get_enemy(enemy_id: String) -> Dictionary:
	var rows: Variant = DataLoader.load_json("res://data/enemies.json", ["id", "name", "power", "description"])
	if rows is Array:
		for row in rows:
			if row.get("id", "") == enemy_id:
				return row
	return {}
