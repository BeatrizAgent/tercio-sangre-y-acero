extends Node

var cache: Dictionary = {}

func load_json(path: String, required_fields: Array = []) -> Variant:
	if cache.has(path):
		return cache[path]

	if not FileAccess.file_exists(path):
		push_error("JSON file missing: %s" % path)
		return null

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("Could not open JSON file: %s" % path)
		return null

	var text := file.get_as_text()
	var parsed: Variant = JSON.parse_string(text)
	if parsed == null:
		push_error("Could not parse JSON file: %s" % path)
		return null

	if not _validate_required_fields(path, parsed, required_fields):
		return null

	cache[path] = parsed
	return parsed

func clear_cache() -> void:
	cache.clear()

func _validate_required_fields(path: String, data: Variant, required_fields: Array) -> bool:
	if required_fields.is_empty():
		return true

	var rows: Array = []
	if data is Array:
		rows = data
	elif data is Dictionary and data.has("entries") and data["entries"] is Array:
		rows = data["entries"]
	elif data is Dictionary:
		rows = [data]
	else:
		push_error("JSON root must be Array or Dictionary: %s" % path)
		return false

	for index in rows.size():
		var row: Variant = rows[index]
		if not row is Dictionary:
			push_error("JSON row %d is not Dictionary in %s" % [index, path])
			return false
		for field in required_fields:
			if not row.has(field):
				push_error("JSON row %d missing '%s' in %s" % [index, field, path])
				return false

	return true
