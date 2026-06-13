extends VBoxContainer

signal navigate(screen_id: String)

@onready var mission_list: ItemList = $MissionList
@onready var message_label: Label = $MessageLabel

var listed_ids: Array[String] = []

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	$StartButton.pressed.connect(_start_selected)
	refresh()

func refresh() -> void:
	mission_list.clear()
	listed_ids.clear()
	for mission in MissionManager.get_missions():
		listed_ids.append(mission.get("id", ""))
		mission_list.add_item("%s | difficulty %d | fatigue +%d" % [
			mission.get("title", ""),
			mission.get("difficulty", 0),
			mission.get("fatigue", 0)
		])

func _start_selected() -> void:
	var selected := mission_list.get_selected_items()
	if selected.is_empty():
		return
	var result := MissionManager.start_mission(listed_ids[selected[0]])
	if bool(result.get("ok", false)):
		navigate.emit("report")
	else:
		message_label.text = result.get("message", "Mission failed to start.")
