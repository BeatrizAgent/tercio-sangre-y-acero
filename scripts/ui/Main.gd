extends Control

const SCREENS := {
	"barracks": preload("res://scenes/barracks/BarracksScreen.tscn"),
	"training": preload("res://scenes/training/TrainingScreen.tscn"),
	"inventory": preload("res://scenes/inventory/InventoryScreen.tscn"),
	"shop": preload("res://scenes/shop/ShopScreen.tscn"),
	"missions": preload("res://scenes/missions/MissionsScreen.tscn"),
	"report": preload("res://scenes/reports/CombatReportScreen.tscn"),
	"hospital": preload("res://scenes/hospital/HospitalScreen.tscn"),
	"event_log": preload("res://scenes/ui/EventLogScreen.tscn")
}

@onready var screen_host: PanelContainer = $Root/ScreenHost

func _ready() -> void:
	show_screen("barracks")

func show_screen(screen_id: String) -> void:
	for child in screen_host.get_children():
		child.queue_free()
	if not SCREENS.has(screen_id):
		push_error("Unknown screen: %s" % screen_id)
		return
	var screen: Node = SCREENS[screen_id].instantiate()
	screen_host.add_child(screen)
	if screen.has_signal("navigate"):
		screen.navigate.connect(show_screen)
