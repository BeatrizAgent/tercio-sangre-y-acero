extends Node

var coins: int = 25
var honor: int = 0
var xp: int = 0
var fatigue: int = 0
var rank_id: String = "bisono"
var reputation: int = 0
var pay_debt: int = 0
var flags: Dictionary = {}
var event_log: Array[String] = []
var last_report: Dictionary = {}

var money: int:
	get:
		return coins
	set(value):
		coins = max(0, value)

func reset() -> void:
	coins = 25
	honor = 0
	xp = 0
	fatigue = 0
	rank_id = "bisono"
	reputation = 0
	pay_debt = 0
	flags.clear()
	event_log.clear()
	last_report.clear()

func add_money(amount: int) -> void:
	add_coins(amount)

func add_coins(amount: int) -> void:
	coins = max(0, coins + amount)

func add_xp(amount: int) -> void:
	xp = max(0, xp + amount)

func add_honor(amount: int) -> void:
	honor = max(0, honor + amount)

func add_fatigue(amount: int) -> void:
	fatigue = clampi(fatigue + amount, 0, 100)

func add_reputation(amount: int) -> void:
	reputation += amount

func set_flag(flag_id: String, value: Variant = true) -> void:
	flags[flag_id] = value

func has_flag(flag_id: String) -> bool:
	return flags.has(flag_id) and bool(flags[flag_id])

func log_event(message: String) -> void:
	event_log.append(message)

func get_summary() -> Dictionary:
	return {
		"coins": coins,
		"honor": honor,
		"xp": xp,
		"fatigue": fatigue,
		"rank_id": rank_id,
		"reputation": reputation,
		"pay_debt": pay_debt
	}
