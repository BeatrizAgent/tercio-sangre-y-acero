extends VBoxContainer

signal navigate(screen_id: String)

@onready var wound_list: ItemList = $WoundList
@onready var message_label: Label = $MessageLabel

var listed_wounds: Array[String] = []

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	$TreatButton.pressed.connect(_treat_selected)
	refresh()

func refresh() -> void:
	wound_list.clear()
	listed_wounds.clear()
	for wound_id in SoldierManager.get_soldier().get("wounds", []):
		listed_wounds.append(wound_id)
		var wound := WoundManager.get_wound(wound_id)
		wound_list.add_item("%s | severity %d" % [wound.get("name", wound_id), wound.get("severity", 0)])
	if listed_wounds.is_empty():
		wound_list.add_item("No wounds recorded.")

func _treat_selected() -> void:
	var selected := wound_list.get_selected_items()
	if selected.is_empty() or listed_wounds.is_empty():
		return
	var wound_id := listed_wounds[selected[0]]
	message_label.text = "Treated %s." % wound_id if WoundManager.treat_wound("diego_de_arce", wound_id, "clean_bandage") else "Treatment failed."
	refresh()
