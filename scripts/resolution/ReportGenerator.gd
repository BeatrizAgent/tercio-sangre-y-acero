extends Node

func generate_mission_report(result: Dictionary, mission: Dictionary, soldier: Dictionary) -> String:
	var fragments := _load_fragments()
	var opening := _first_fragment(fragments, "opening", mission.get("report_tags", []))
	var success_key := "success" if bool(result.get("success", false)) else "failure"
	var outcome := _first_fragment(fragments, success_key, mission.get("report_tags", []))
	var wound_text := _wound_sentence(result.get("wounds", []))
	var loot_text := _loot_sentence(result.get("loot", []))
	var reward: Dictionary = result.get("rewards", {})
	return "%s\n\n%s\n\n%s returned with %d coins, %d XP, %d honor, and %d fatigue. %s%s" % [
		opening,
		outcome.replace("{power}", result.get("report_context", {}).get("best_power", "discipline")),
		soldier.get("name", "The soldier"),
		reward.get("coins", 0),
		reward.get("xp", 0),
		reward.get("honor", 0),
		result.get("fatigue", 0),
		wound_text,
		loot_text
	]

func _load_fragments() -> Array:
	var rows: Variant = DataLoader.load_json("res://data/report_fragments.json", ["id", "type", "tags", "text"])
	return rows if rows is Array else []

func _first_fragment(fragments: Array, fragment_type: String, tags: Array) -> String:
	for fragment in fragments:
		if fragment.get("type", "") != fragment_type:
			continue
		for tag in tags:
			if fragment.get("tags", []).has(tag):
				return fragment.get("text", "")
	for fragment in fragments:
		if fragment.get("type", "") == fragment_type:
			return fragment.get("text", "")
	return ""

func _wound_sentence(wounds: Array) -> String:
	if wounds.is_empty():
		return "No fresh wound was recorded."
	return "A fresh wound was recorded: %s." % ", ".join(wounds)

func _loot_sentence(loot: Array) -> String:
	if loot.is_empty():
		return ""
	var names: Array[String] = []
	for row in loot:
		names.append("%s x%d" % [row.get("id", ""), row.get("quantity", 1)])
	return " Loot: %s." % ", ".join(names)
