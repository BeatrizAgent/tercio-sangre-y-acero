extends Node

var shops: Dictionary = {}

func _ready() -> void:
	load_shops()

func load_shops() -> void:
	shops.clear()
	var rows: Variant = DataLoader.load_json("res://data/shops.json", ["id", "name", "inventory"])
	if rows is Array:
		for row in rows:
			shops[row["id"]] = row

func get_shop(shop_id: String = "company_armory") -> Dictionary:
	return shops.get(shop_id, {})

func get_shop_rows(shop_id: String = "company_armory") -> Array:
	var shop := get_shop(shop_id)
	return shop.get("inventory", [])

func buy_item(shop_id: String, item_id: String, quantity: int = 1) -> bool:
	if quantity <= 0:
		return false
	var price := _get_buy_price(shop_id, item_id)
	var total := price * quantity
	if price <= 0 or GameState.coins < total:
		return false
	GameState.add_coins(-total)
	InventoryManager.add_item(item_id, quantity)
	GameState.log_event("Bought %s x%d." % [item_id, quantity])
	return true

func sell_item(shop_id: String, item_id: String, quantity: int = 1) -> bool:
	if quantity <= 0:
		return false
	var price := _get_sell_price(shop_id, item_id)
	if price <= 0 or not InventoryManager.remove_item(item_id, quantity):
		return false
	GameState.add_coins(price * quantity)
	GameState.log_event("Sold %s x%d." % [item_id, quantity])
	return true

func _get_buy_price(shop_id: String, item_id: String) -> int:
	for row in get_shop_rows(shop_id):
		if row.get("item_id", "") == item_id:
			return int(row.get("buy_price", 0))
	return 0

func _get_sell_price(shop_id: String, item_id: String) -> int:
	for row in get_shop_rows(shop_id):
		if row.get("item_id", "") == item_id:
			return int(row.get("sell_price", 0))
	var base_value := int(InventoryManager.get_item_def(item_id).get("value", 1))
	return maxi(1, floori(float(base_value) / 2.0))
