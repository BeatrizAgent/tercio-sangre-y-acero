extends VBoxContainer

signal navigate(screen_id: String)

@onready var weight_label: Label = $WeightLabel
@onready var equipped_label: RichTextLabel = $EquippedLabel
@onready var item_list: ItemList = $ItemList
@onready var message_label: Label = $MessageLabel

var listed_ids: Array[String] = []

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	$Actions/EquipButton.pressed.connect(_equip_selected)
	$Actions/UseButton.pressed.connect(_use_selected)
	refresh()

func refresh() -> void:
	item_list.clear()
	listed_ids.clear()
	weight_label.text = "Total weight: %.1f" % InventoryManager.get_total_weight()
	var equipped_lines: Array[String] = []
	for slot in EquipmentManager.get_equipped().keys():
		var item_id: String = EquipmentManager.get_equipped()[slot]
		equipped_lines.append("%s: %s" % [slot, item_id if not item_id.is_empty() else "-"])
	equipped_label.text = "\n".join(equipped_lines)
	for row in InventoryManager.get_inventory_rows():
		listed_ids.append(row["id"])
		item_list.add_item("%s x%d (%s)" % [row["name"], row["quantity"], row["type"]])

func _use_selected() -> void:
	var selected := item_list.get_selected_items()
	if selected.is_empty():
		return
	var item_id := listed_ids[selected[0]]
	message_label.text = "Used %s." % item_id if InventoryManager.use_consumable(item_id) else "Cannot use selected item."
	refresh()

func _equip_selected() -> void:
	var selected := item_list.get_selected_items()
	if selected.is_empty():
		return
	var item_id := listed_ids[selected[0]]
	message_label.text = "Equipped %s." % item_id if EquipmentManager.equip(item_id) else "Cannot equip selected item."
	refresh()
