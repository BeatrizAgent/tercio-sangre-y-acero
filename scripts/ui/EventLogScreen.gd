extends VBoxContainer

signal navigate(screen_id: String)

@onready var log_text: RichTextLabel = $LogText

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	log_text.text = "No entries yet." if GameState.event_log.is_empty() else "\n".join(GameState.event_log)
