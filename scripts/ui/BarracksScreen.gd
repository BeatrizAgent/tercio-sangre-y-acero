extends VBoxContainer

signal navigate(screen_id: String)

@onready var summary_label: RichTextLabel = $SummaryLabel

func _ready() -> void:
	$Menu/TrainingButton.pressed.connect(func(): navigate.emit("training"))
	$Menu/InventoryButton.pressed.connect(func(): navigate.emit("inventory"))
	$Menu/ArmoryButton.pressed.connect(func(): navigate.emit("shop"))
	$Menu/MissionsButton.pressed.connect(func(): navigate.emit("missions"))
	$Menu/HospitalButton.pressed.connect(func(): navigate.emit("hospital"))
	$Menu/LogButton.pressed.connect(func(): navigate.emit("event_log"))
	refresh()

func refresh() -> void:
	var soldier := SoldierManager.get_soldier()
	var stats: Dictionary = soldier.get("stats", {})
	var wounds: Array = soldier.get("wounds", [])
	var equipped := EquipmentManager.get_equipped()
	var stat_lines: Array[String] = []
	for stat_id in stats.keys():
		stat_lines.append("%s: %d" % [stat_id, stats[stat_id]])
	var equipment_lines: Array[String] = []
	for slot in equipped.keys():
		var item_id: String = equipped[slot]
		equipment_lines.append("%s: %s" % [slot, item_id if not item_id.is_empty() else "-"])
	summary_label.text = "%s\nRank: %s\nCoins: %d | Honor: %d | XP: %d | Fatigue: %d | Reputation: %d\n\nStats\n%s\n\nWounds: %s\n\nEquipment\n%s" % [
		soldier.get("name", "Soldier"),
		SoldierManager.get_rank_name(),
		GameState.coins,
		GameState.honor,
		GameState.xp,
		GameState.fatigue,
		GameState.reputation,
		"\n".join(stat_lines),
		"none" if wounds.is_empty() else ", ".join(wounds),
		"\n".join(equipment_lines)
	]
