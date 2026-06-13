extends Node

var training_options: Array = []

func _ready() -> void:
	load_training()

func load_training() -> void:
	training_options.clear()
	var rows: Variant = DataLoader.load_json("res://data/training.json", ["stat_id", "name", "cost", "gain", "description"])
	if rows is Array:
		training_options = rows

func get_training_options() -> Array:
	return training_options

func train(stat_id: String) -> Dictionary:
	for option in training_options:
		if option.get("stat_id", "") == stat_id:
			if not SoldierManager.can_pay_training(option):
				return {"ok": false, "message": "Not enough coin or experience for this drill."}
			SoldierManager.pay_training(option)
			SoldierManager.add_stat(stat_id, int(option.get("gain", 1)))
			SoldierManager.add_fatigue(int(option.get("fatigue", 4)))
			var message := "Trained %s." % option.get("name", stat_id)
			GameState.log_event(message)
			return {"ok": true, "message": message}
	return {"ok": false, "message": "Unknown training drill."}
