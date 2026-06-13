extends Node

const SAVE_PATH := "user://frontera_de_ceniza.save"

func build_save_payload() -> Dictionary:
	return {
		"version": 1,
		"game_state": GameState.get_summary(),
		"soldier": SoldierManager.get_soldier(),
		"inventory": InventoryManager.inventory,
		"equipment": EquipmentManager.get_equipped(),
		"flags": GameState.flags,
		"event_log": GameState.event_log,
		"last_report": GameState.last_report
	}

func save_game() -> bool:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Could not open save file for writing.")
		return false
	file.store_string(JSON.stringify(build_save_payload(), "\t"))
	return true

func load_game() -> bool:
	push_warning("SaveManager.load_game is stubbed for the scaffold.")
	return false
