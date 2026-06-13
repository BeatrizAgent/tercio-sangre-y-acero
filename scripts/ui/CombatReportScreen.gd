extends VBoxContainer

signal navigate(screen_id: String)

@onready var report_text: RichTextLabel = $ReportText

func _ready() -> void:
	$BackButton.pressed.connect(func(): navigate.emit("barracks"))
	var report: Dictionary = GameState.last_report
	report_text.text = report.get("report", "No report has been written yet.")
