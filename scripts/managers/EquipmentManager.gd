extends Node

var equipped: Dictionary = {
	"head": "",
	"body": "",
	"main_hand": "",
	"off_hand": "",
	"firearm": "",
	"accessory": "",
	"boots": "",
	"consumable": ""
}

func _ready() -> void:
	equip("rusty_pike")
	equip("patched_doublet")

func equip(item_id: String) -> bool:
	var item := InventoryManager.get_item_def(item_id)
	if item.is_empty() or not InventoryManager.has_item(item_id):
		return false
	var slot: String = item.get("slot", "")
	if slot.is_empty() or not equipped.has(slot):
		return false
	equipped[slot] = item_id
	GameState.log_event("Equipped %s." % item.get("name", item_id))
	return true

func unequip(slot: String) -> bool:
	if not equipped.has(slot):
		return false
	equipped[slot] = ""
	return true

func get_equipped() -> Dictionary:
	return equipped

func get_equipment_modifiers() -> Dictionary:
	var modifiers: Dictionary = {}
	for item_id in equipped.values():
		if String(item_id).is_empty():
			continue
		var item := InventoryManager.get_item_def(item_id)
		var effects: Dictionary = item.get("effects", {})
		for key in effects.keys():
			modifiers[key] = int(modifiers.get(key, 0)) + int(effects[key])
	return modifiers
