extends VBoxContainer

signal navigate(screen_id: String)

@onready var money_label: Label = $Header/MoneyLabel
@onready var shop_list: ItemList = $ShopList
@onready var message_label: Label = $MessageLabel

var listed_ids: Array[String] = []
const SHOP_ID := "company_armory"

func _ready() -> void:
	$Header/BackButton.pressed.connect(func(): navigate.emit("barracks"))
	$Actions/BuyButton.pressed.connect(_buy_selected)
	$Actions/SellButton.pressed.connect(_sell_selected)
	refresh()

func refresh() -> void:
	shop_list.clear()
	listed_ids.clear()
	money_label.text = "Coins: %d" % GameState.coins
	for row in ShopManager.get_shop_rows(SHOP_ID):
		var item_id: String = row.get("item_id", "")
		var item := InventoryManager.get_item_def(item_id)
		listed_ids.append(item_id)
		shop_list.add_item("%s | buy %d | sell %d | stock %d" % [
			item.get("name", item_id),
			row.get("buy_price", 0),
			row.get("sell_price", 0),
			row.get("stock", 0)
		])

func _buy_selected() -> void:
	var selected := shop_list.get_selected_items()
	if selected.is_empty():
		return
	message_label.text = "Bought item." if ShopManager.buy_item(SHOP_ID, listed_ids[selected[0]], 1) else "Cannot buy item."
	refresh()

func _sell_selected() -> void:
	var selected := shop_list.get_selected_items()
	if selected.is_empty():
		return
	message_label.text = "Sold item." if ShopManager.sell_item(SHOP_ID, listed_ids[selected[0]], 1) else "Cannot sell item."
	refresh()
