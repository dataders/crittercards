extends "res://battle.gd"

const SKIN_COLORS := {
	"gold": Color("#ffd48a"),
	"diamond": Color("#b4edff"),
}
const SKIN_SHADERS := {
	"shiny": preload("res://invert.gdshader"),
	"rainbow": preload("res://rainbow.gdshader"),
}

var bridge: JavaScriptObject
var callback: JavaScriptObject
var rivals := VBoxContainer.new()
var potion_row := HBoxContainer.new()
var last_rivals: Array = []
var last_potions: Array = []
var has_combat := false
var portraits := {}
var skin_materials := {}


func _ready() -> void:
	if not OS.has_feature("web"):
		get_tree().change_scene_to_file.call_deferred("res://battle.tscn")
		return
	var browser := JavaScriptBridge.get_interface("window")
	bridge = browser.parent.crittercardsGodot
	if bridge == null:
		get_tree().change_scene_to_file.call_deferred("res://battle.tscn")
		return
	_setup_scene()
	for key in ["draft", "skip", "restart", "target"]:
		buttons[key].hide()
	labels.enemy.hide()
	bramble.hide()
	hand.max_hand_size = 15
	_make_button("companion", "Companion", _input_action.bind("companion"))
	for pile in ["draw", "discard"]:
		_make_button(pile + "_pile", "", _input_action.bind(pile))
		var area: Button = buttons[pile + "_pile"]
		area.flat = true
		area.tooltip_text = "Inspect " + pile + " pile"
		area.accessibility_name = area.tooltip_text
		area.z_index = 25
	rivals.add_theme_constant_override("separation", 5)
	potion_row.add_theme_constant_override("separation", 5)
	potion_row.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(rivals)
	add_child(potion_row)
	resized.connect(_layout)
	_layout()
	callback = JavaScriptBridge.create_callback(_receive)
	bridge.attachView(callback)
	buttons.turn.grab_focus()


func _layout() -> void:
	super._layout()
	var center := size.x / 2.0
	var floor_y := size.y
	var arena_y := clampf((floor_y - 620.0) * 0.25 + 86.0, 86.0, 210.0)
	_place(hudson, Vector2(center * 0.48, arena_y), Vector2(110, 145))
	_place(labels.player, Vector2(center * 0.48, arena_y + 150), Vector2(260, 36))
	_place(rivals, Vector2(center * 1.46, arena_y), Vector2(minf(center * 0.97, 390), 160))
	_place(potion_row, Vector2(center, floor_y - 310), Vector2(minf(size.x - 22, 610), 43))
	_place(buttons.companion, Vector2(center - 98, floor_y - 62), Vector2(150, 46))
	_place(buttons.turn, Vector2(center + 82, floor_y - 62), Vector2(150, 46))
	_place(buttons.draw_pile, Vector2(62, floor_y - 278), Vector2(100, 244))
	_place(buttons.discard_pile, Vector2(size.x - 62, floor_y - 252), Vector2(100, 218))


func _receive(args: Array) -> void:
	var model: Variant = JSON.parse_string(args[0])
	if not model is Dictionary:
		return
	if not model.active:
		if has_combat:
			for zone in [hand, draw_pile, discard]:
				zone.clear_cards()
		has_combat = false
		return
	has_combat = true
	labels.title.text = model.title
	labels.player.text = "%s · %s HP · %s Block" % [model.player.name, int(model.player.hp), int(model.player.block)]
	labels.status.text = "Round %s · %s energy%s" % [int(model.round), int(model.energy), " · Choose a rival" if model.targeting else ("" if model.enabled else " · Waiting")]
	hudson.texture = _portrait(model.player.animal, model.player.skin)
	_apply_skin(hudson, model.player.skin)

	if last_rivals != model.rivals:
		_render_rivals(model.rivals)
		last_rivals = model.rivals
	if last_potions != model.potions:
		_render_potions(model.potions)
		last_potions = model.potions
	for potion in potion_row.get_children():
		potion.disabled = not model.enabled

	var backs: Array = []
	for index in range(int(model.draw)):
		backs.append({"id": "_back", "index": index, "name": "", "cost": "", "text": "", "enabled": false})
	_sync_zones(model.hand, model.discard, backs)
	labels.draw.text = "%s cards" % int(model.draw)
	labels.discard.text = "Discard %s" % model.discard.size()
	buttons.turn.disabled = not model.enabled
	buttons.companion.disabled = not model.companion


func _portrait(id: String, skin: Variant) -> Texture2D:
	var folder := "glitched/" if skin == "glitched" else ""
	var path := "res://assets/%s%s.webp" % [folder, id]
	if not portraits.has(path):
		portraits[path] = load(path) if ResourceLoader.exists(path) else null
	return portraits[path]


func _apply_skin(control: Control, skin: Variant) -> void:
	control.modulate = SKIN_COLORS.get(skin, Color.WHITE)
	if SKIN_SHADERS.has(skin) and not skin_materials.has(skin):
		var material_override := ShaderMaterial.new()
		material_override.shader = SKIN_SHADERS[skin]
		skin_materials[skin] = material_override
	control.material = skin_materials.get(skin)


func _render_rivals(entries: Array) -> void:
	for child in rivals.get_children():
		rivals.remove_child(child)
		child.queue_free()
	for rival in entries:
		var target := Button.new()
		target.text = "%s · %s HP%s\n%s" % [
			rival.name, int(rival.hp), " · %s Block" % int(rival.block) if rival.block else "", rival.intent
		]
		target.tooltip_text = rival.intent
		target.custom_minimum_size.y = 72
		target.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		target.add_theme_font_size_override("font_size", 18)
		target.disabled = rival.hp <= 0
		var index := int(rival.index)
		target.pressed.connect(_input_action.bind("target", index))
		target.set_drag_forwarding(Callable(), _can_drag_to.bind(index), _drag_to.bind(index))
		var row := HBoxContainer.new()
		var portrait := TextureRect.new()
		portrait.texture = _portrait(rival.animal, rival.skin)
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		portrait.custom_minimum_size.x = 46
		portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_apply_skin(portrait, rival.skin)
		row.add_child(portrait)
		target.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(target)
		rivals.add_child(row)


func _render_potions(entries: Array) -> void:
	for child in potion_row.get_children():
		potion_row.remove_child(child)
		child.queue_free()
	for index in entries.size():
		var potion := Button.new()
		potion.text = entries[index]
		potion.custom_minimum_size.y = 40
		potion.pressed.connect(_input_action.bind("potion", index))
		potion_row.add_child(potion)


func _sync_zones(hand_data: Array, discard_data: Array, back_data: Array) -> void:
	var zones: Array[CardContainer] = [hand, discard, draw_pile]
	var data := [hand_data, discard_data, back_data]
	var spare: Array = []
	var desired: Array = [[], [], []]
	# Prefer cards already in the right zone; moved instances keep the framework tween.
	for lane in zones.size():
		var previous := zones[lane].cards_node.get_children()
		for info in data[lane]:
			var card := _take_matching(previous, info.id)
			desired[lane].append(card)
		spare.append_array(previous)
	for lane in zones.size():
		for index in data[lane].size():
			var info: Dictionary = data[lane][index]
			var card: Card = desired[lane][index]
			if card == null:
				card = _take_matching(spare, info.id)
			if card == null and not spare.is_empty():
				card = spare.pop_front()
			if card == null:
				card = _new_card()
				card.global_position = draw_pile.global_position
			_set_card(card, info, lane == 0)
			var zone := zones[lane]
			if card.card_container != zone or card.get_index() != index:
				if card.card_container:
					card.card_container.remove_card(card)
				zone.add_card(card, index)
	for card: Card in spare:
		card.card_container.remove_card(card)
		card.queue_free()


func _take_matching(pool: Array, id: String) -> Card:
	for index in pool.size():
		if pool[index].card_info.get("id") == id:
			return pool.pop_at(index) as Card
	return null


func _new_card() -> Card:
	var card := super._create_card("strike")
	var face: Button = card.get_node("FrontFace/TextureRect").get_child(0)
	face.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	face.add_theme_font_size_override("font_size", 11)
	return card


func _set_card(card: Card, info: Dictionary, in_hand: bool) -> void:
	card.card_info = info
	card.card_name = info.name
	var face: Button = card.get_node("FrontFace/TextureRect").get_child(0)
	var card_text := "%s\n%s\n%s" % [info.cost, info.name, info.text]
	face.text = card_text
	face.tooltip_text = card_text
	face.disabled = not in_hand or not info.enabled
	face.modulate = Color("#ffe3a4") if info.get("selected", false) else Color.WHITE


func _can_play(card: Card) -> bool:
	return hand.has_card(card) and card.card_info.get("enabled", false)


func _can_drag_to(_pos: Vector2, value: Variant, _target: int) -> bool:
	return value is Card and _can_play(value)


func _drag_to(_pos: Vector2, card: Variant, target: int) -> void:
	_input_action("drag", int(card.card_info.index), target)


func _play(card: Card) -> void:
	if _can_play(card):
		_input_action("card", int(card.card_info.index))


func _end_turn() -> void:
	_input_action("end")


func _input_action(kind: String, index: int = -1, target: int = -1) -> void:
	if bridge != null:
		bridge.input(kind, index, target)
