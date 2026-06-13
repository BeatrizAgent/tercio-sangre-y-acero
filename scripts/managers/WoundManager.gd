extends Node

var wound_defs: Dictionary = {}

func _ready() -> void:
	load_wounds()

func load_wounds() -> void:
	wound_defs.clear()
	var rows: Variant = DataLoader.load_json("res://data/wounds.json", ["id", "name", "severity", "effects", "description", "treatment_items"])
	if rows is Array:
		for row in rows:
			wound_defs[row["id"]] = row

func has_wound(wound_id: String) -> bool:
	return wound_defs.has(wound_id)

func get_wound(wound_id: String) -> Dictionary:
	return wound_defs.get(wound_id, {})

func treat_wound(_member_id: String, wound_id: String, item_id: String) -> bool:
	var wound := get_wound(wound_id)
	if wound.is_empty():
		return false
	var treatment_items: Array = wound.get("treatment_items", [])
	if not treatment_items.has(item_id):
		return false
	if not InventoryManager.remove_item(item_id, 1):
		return false
	return SoldierManager.remove_wound(wound_id)
