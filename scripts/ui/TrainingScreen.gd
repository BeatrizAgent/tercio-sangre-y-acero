extends VBoxContainer

signal navigate(screen_id: String)

@onready var resource_label: Label = $ResourceLabel
@onready var training_list: ItemList = $TrainingList
@onready var message_label: Label = $MessageLabel

var listed_stats: Array[String] = []

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	$TrainButton.pressed.connect(_train_selected)
	refresh()

func refresh() -> void:
	training_list.clear()
	listed_stats.clear()
	resource_label.text = "Coins: %d | XP: %d | Fatigue: %d" % [GameState.coins, GameState.xp, GameState.fatigue]
	for option in TrainingManager.get_training_options():
		listed_stats.append(option.get("stat_id", ""))
		var cost: Dictionary = option.get("cost", {})
		training_list.add_item("%s +%d | coins %d, xp %d | fatigue +%d" % [
			option.get("name", ""),
			option.get("gain", 1),
			cost.get("coins", 0),
			cost.get("xp", 0),
			option.get("fatigue", 0)
		])

func _train_selected() -> void:
	var selected := training_list.get_selected_items()
	if selected.is_empty():
		return
	var result := TrainingManager.train(listed_stats[selected[0]])
	message_label.text = result.get("message", "")
	refresh()
