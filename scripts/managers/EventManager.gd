extends Node

var events: Dictionary = {}

func _ready() -> void:
	load_events()

func load_events() -> void:
	events.clear()
	var rows: Variant = DataLoader.load_json("res://data/events.json", ["id", "title", "text", "choices"])
	if rows is Array:
		for row in rows:
			events[row["id"]] = row

func get_event(event_id: String) -> Dictionary:
	return events.get(event_id, {})

func resolve_choice(event_id: String, choice_id: String) -> Dictionary:
	var event := get_event(event_id)
	if event.is_empty():
		return {"ok": false, "message": "Unknown event."}

	for choice in event.get("choices", []):
		if choice.get("id", "") == choice_id:
			if not _pay_costs(choice.get("costs", {})):
				return {"ok": false, "message": "Costs could not be paid."}
			_apply_effects(choice.get("effects", {}))
			var result: String = choice.get("result_text", "The company moves on.")
			GameState.log_event(result)
			return {"ok": true, "message": result}

	return {"ok": false, "message": "Unknown choice."}

func _pay_costs(costs: Dictionary) -> bool:
	if costs.has("money") and GameState.money < int(costs["money"]):
		return false
	if costs.has("items"):
		for item_cost in costs["items"]:
			if not InventoryManager.has_item(item_cost.get("id", ""), int(item_cost.get("quantity", 1))):
				return false

	if costs.has("money"):
		GameState.add_money(-int(costs["money"]))
	if costs.has("items"):
		for item_cost in costs["items"]:
			InventoryManager.remove_item(item_cost.get("id", ""), int(item_cost.get("quantity", 1)))
	return true

func _apply_effects(effects: Dictionary) -> void:
	if effects.has("money"):
		GameState.add_coins(int(effects["money"]))
	if effects.has("coins"):
		GameState.add_coins(int(effects["coins"]))
	if effects.has("honor"):
		SoldierManager.add_honor(int(effects["honor"]))
	if effects.has("xp"):
		SoldierManager.add_xp(int(effects["xp"]))
	if effects.has("fatigue"):
		SoldierManager.add_fatigue(int(effects["fatigue"]))
	if effects.has("reputation"):
		GameState.add_reputation(int(effects["reputation"]))
	if effects.has("items_add"):
		for item_gain in effects["items_add"]:
			InventoryManager.add_item(item_gain.get("id", ""), int(item_gain.get("quantity", 1)))
	if effects.has("wounds_add"):
		for wound in effects["wounds_add"]:
			SoldierManager.apply_wound(wound.get("wound_id", "shallow_cut"))
	if effects.has("flags"):
		for flag_id in effects["flags"].keys():
			GameState.set_flag(flag_id, effects["flags"][flag_id])
