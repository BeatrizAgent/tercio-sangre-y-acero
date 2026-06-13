extends Node

var item_defs: Dictionary = {}
var inventory: Dictionary = {}

func _ready() -> void:
	load_items()
	_add_starting_items()

func load_items() -> void:
	item_defs.clear()
	var rows: Variant = DataLoader.load_json("res://data/items.json", ["id", "name", "type", "weight", "value", "stackable", "effects", "description"])
	if not rows is Array:
		return
	for row in rows:
		item_defs[row["id"]] = row

func get_item_def(item_id: String) -> Dictionary:
	return item_defs.get(item_id, {})

func add_item(item_id: String, quantity: int = 1) -> void:
	if quantity <= 0:
		return
	if not item_defs.has(item_id):
		push_error("Unknown item id: %s" % item_id)
		return
	inventory[item_id] = int(inventory.get(item_id, 0)) + quantity

func remove_item(item_id: String, quantity: int = 1) -> bool:
	if quantity <= 0:
		return true
	var current := int(inventory.get(item_id, 0))
	if current < quantity:
		return false
	var next := current - quantity
	if next <= 0:
		inventory.erase(item_id)
	else:
		inventory[item_id] = next
	return true

func has_item(item_id: String, quantity: int = 1) -> bool:
	return int(inventory.get(item_id, 0)) >= quantity

func use_consumable(item_id: String) -> bool:
	var item := get_item_def(item_id)
	if item.is_empty() or item.get("type", "") != "food" and item.get("type", "") != "medicine":
		return false
	if not remove_item(item_id, 1):
		return false
	var effects: Dictionary = item.get("effects", {})
	if effects.has("fatigue"):
		SoldierManager.add_fatigue(int(effects["fatigue"]))
	if effects.has("honor"):
		SoldierManager.add_honor(int(effects["honor"]))
	if effects.has("wound_treatment"):
		SoldierManager.treat_first_wound()
	GameState.log_event("Used %s." % item.get("name", item_id))
	return true

func get_inventory_rows() -> Array:
	var rows: Array = []
	for item_id in inventory.keys():
		var item := get_item_def(item_id)
		rows.append({
			"id": item_id,
			"name": item.get("name", item_id),
			"quantity": inventory[item_id],
			"weight": item.get("weight", 0.0),
			"type": item.get("type", "unknown")
		})
	return rows

func get_total_weight() -> float:
	var total := 0.0
	for item_id in inventory.keys():
		var item := get_item_def(item_id)
		total += float(item.get("weight", 0.0)) * int(inventory[item_id])
	return total

func _add_starting_items() -> void:
	add_item("hard_bread", 2)
	add_item("clean_bandage", 2)
	add_item("rusty_pike", 1)
	add_item("patched_doublet", 1)
