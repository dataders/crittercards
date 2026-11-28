extends Control

const FACTORY = preload("res://factory.tscn")
const CARD_SCENE = preload("res://addons/card-framework/card.tscn")
const CardButton = preload("res://card_button.gd")
const CARD_SIZE := Vector2(94, 126)
const CARDS := {
	"strike": {"name": "Claw Strike", "cost": 1, "damage": 6, "block": 0},
	"guard": {"name": "Hold Fast", "cost": 1, "damage": 0, "block": 8},
	"lunge": {"name": "Briar Lunge", "cost": 2, "damage": 13, "block": 0},
	"jab": {"name": "Quick Jab", "cost": 0, "damage": 2, "block": 0},
}
const DECK := ["strike", "guard", "jab", "strike", "guard", "lunge", "strike", "guard", "jab", "lunge",
	"guard", "strike", "guard", "strike", "lunge"]

var rng := RandomNumberGenerator.new()
var hand := Hand.new()
var draw_pile := Pile.new()
var discard := Pile.new()
var labels: Dictionary
var buttons: Dictionary
var hudson: TextureRect
var bramble: TextureRect
var shield := 0
var hp := 45
var enemy_hp := 29
var enemy_block := 0
var energy := 3
var round_number := 1
var phase := "battle"


func _ready() -> void:
	_setup_scene()
	resized.connect(_layout)
	_layout()
	_start()


func _setup_scene() -> void:
	var background := _picture(preload("res://assets/hollow-battle.webp"))
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	var shade := ColorRect.new()
	shade.color = Color(0.034, 0.072, 0.065, 0.57)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(shade)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hudson = _picture(preload("res://assets/hudson.webp"))
	bramble = _picture(preload("res://assets/badger.webp"))

	var manager := CardManager.new()
	manager.card_size = CARD_SIZE
	manager.card_factory_scene = FACTORY
	manager.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(manager)
	hand.max_hand_size = 5
	hand.card_hover_distance = 0
	hand.align_drop_zone_size_with_current_hand_size = false
	for zone in [draw_pile, discard, hand]:
		zone.enable_drop_zone = false
		zone.mouse_filter = Control.MOUSE_FILTER_IGNORE
		manager.add_child(zone)
	draw_pile.card_face_up = false
	draw_pile.allow_card_movement = false
	discard.allow_card_movement = false

	_make_label("title", "Moonlit Clearing", 30)
	_make_label("player", "", 21)
	_make_label("enemy", "", 21)
	_make_label("status", "", 17)
	_make_label("draw", "", 16)
	_make_label("discard", "", 16)
	_make_button("turn", "End turn", _end_turn)
	_make_button("draft", "Take Briar Lunge", _finish.bind(true))
	_make_button("skip", "Skip card", _finish.bind(false))
	_make_button("restart", "Replay fight", _start)
	_make_button("target", "Bramble", func() -> void: pass)
	buttons.target.set_drag_forwarding(Callable(), _can_drop_attack, _drop_attack)
	buttons.target.focus_mode = Control.FOCUS_NONE
	buttons.target.modulate = Color(1, 1, 1, 0)


func _picture(image: Texture2D) -> TextureRect:
	var picture := TextureRect.new()
	picture.texture = image
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(picture)
	return picture


func _make_label(key: String, text: String, font_size: int) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color("#f0edda"))
	label.add_theme_color_override("font_shadow_color", Color.BLACK)
	label.add_theme_constant_override("shadow_offset_y", 2)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(label)
	labels[key] = label


func _make_button(key: String, text: String, action: Callable) -> void:
	var button := Button.new()
	button.text = text
	button.pressed.connect(action)
	add_child(button)
	buttons[key] = button


func _layout() -> void:
	var center := size.x / 2.0
	var bottom := size.y
	var gap := minf(center * 0.49, 240.0)
	var arena_y := clampf((bottom - 620.0) * 0.35 + 65.0, 65.0, 180.0)
	_place(labels.title, Vector2(center, 18), Vector2(500, 44))
	_place(hudson, Vector2(center - gap, arena_y), Vector2(130, 174))
	_place(bramble, Vector2(center + gap, arena_y), Vector2(130, 174))
	_place(buttons.target, Vector2(center + gap, arena_y), Vector2(155, 220))
	_place(labels.player, Vector2(center - gap, arena_y + 171), Vector2(290, 34))
	_place(labels.enemy, Vector2(center + gap, arena_y + 171), Vector2(290, 34))
	_place(labels.status, Vector2(center, bottom - 258), Vector2(610, 35))
	draw_pile.position = Vector2(15, bottom - 204)
	discard.position = Vector2(size.x - CARD_SIZE.x - 15, bottom - 204)
	hand.position = Vector2(center, bottom - 201)
	hand.max_hand_spread = clampf(size.x - 190, 450, 630)
	for zone in [draw_pile, discard, hand]:
		zone.update_card_ui()
	_place(labels.draw, Vector2(63, bottom - 67), Vector2(118, 44))
	_place(labels.discard, Vector2(size.x - 63, bottom - 67), Vector2(118, 44))
	_place(buttons.turn, Vector2(center, bottom - 61), Vector2(158, 46))
	_place(buttons.draft, Vector2(center - 92, bottom - 61), Vector2(164, 46))
	_place(buttons.skip, Vector2(center + 92, bottom - 61), Vector2(140, 46))
	_place(buttons.restart, Vector2(center, bottom - 61), Vector2(158, 46))


func _place(control: Control, top_center: Vector2, dimensions: Vector2) -> void:
	control.position = top_center - Vector2(dimensions.x * 0.5, 0)
	control.size = dimensions


func _start() -> void:
	for zone in [draw_pile, hand, discard]:
		zone.clear_cards()
	rng.seed = 41
	phase = "battle"
	hp = 45
	enemy_hp = 29
	enemy_block = 0
	energy = 3
	shield = 0
	round_number = 1
	var order := DECK.duplicate()
	_shuffle(order)
	for kind in order:
		draw_pile.add_card(_create_card(kind))
	_deal()
	buttons.turn.grab_focus()


func _create_card(kind: String) -> Card:
	var rule: Dictionary = CARDS[kind]
	var card := CARD_SCENE.instantiate() as Card
	card.card_name = rule.name
	card.card_info = rule
	card.card_size = CARD_SIZE
	card.moving_speed = 1600
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var back := ColorRect.new()
	back.color = Color("#173a2d")
	back.size = CARD_SIZE
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.get_node("BackFace/TextureRect").add_child(back)

	var face := CardButton.new()
	face.card = card
	face.allow_drag = _can_play
	face.size = CARD_SIZE
	face.text = "%s\n\n%s\n\n%s" % [
		rule.cost, rule.name, "%s damage" % rule.damage if rule.damage else "%s Block" % rule.block]
	face.add_theme_font_size_override("font_size", 12)
	face.pressed.connect(_play.bind(card))
	card.get_node("FrontFace/TextureRect").add_child(face)
	for path in ["FrontFace", "BackFace", "FrontFace/TextureRect", "BackFace/TextureRect"]:
		card.get_node(path).mouse_filter = Control.MOUSE_FILTER_IGNORE

	var style := StyleBoxFlat.new()
	style.bg_color = Color("#412a2b") if rule.damage else Color("#273744")
	style.border_color = Color("#d4a57e") if rule.damage else Color("#94bcbe")
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	face.add_theme_stylebox_override("normal", style)
	var highlight := style.duplicate() as StyleBoxFlat
	highlight.bg_color = style.bg_color.lightened(0.18)
	face.add_theme_stylebox_override("hover", highlight)
	return card


func _shuffle(items: Array) -> void:
	for index in range(items.size() - 1, 0, -1):
		var swap := rng.randi_range(0, index)
		var original: Variant = items[index]
		items[index] = items[swap]
		items[swap] = original


func _deal() -> void:
	for _slot in range(5):
		if draw_pile.get_card_count() == 0:
			var recycled := discard.get_top_cards(discard.get_card_count())
			_shuffle(recycled)
			draw_pile.move_cards(recycled, -1, false)
		hand.move_cards(draw_pile.get_top_cards(1), -1, false)
	_update_hud()


func _can_play(card: Card) -> bool:
	return phase == "battle" and hand.has_card(card) and energy >= card.card_info.cost


func _can_drop_attack(_at: Vector2, card: Variant) -> bool:
	return card is Card and card.card_info.damage > 0 and _can_play(card)


func _drop_attack(_at: Vector2, card: Variant) -> void:
	_play(card)


func _play(card: Card) -> void:
	if not _can_play(card):
		return
	var rule := card.card_info
	energy -= rule.cost
	shield += rule.block
	var blocked := mini(enemy_block, rule.damage)
	enemy_block -= blocked
	enemy_hp = maxi(0, enemy_hp - (rule.damage - blocked))
	discard.move_cards([card], -1, false)
	if enemy_hp == 0:
		phase = "reward"
		buttons.draft.grab_focus.call_deferred()
	_update_hud()


func _end_turn() -> void:
	if phase != "battle":
		return
	discard.move_cards(hand.cards_node.get_children(), -1, false)
	if round_number % 2 == 0:
		enemy_block = 6
	else:
		hp = maxi(0, hp - maxi(0, 9 - shield))
	if hp == 0:
		phase = "defeat"
		_update_hud()
		buttons.restart.grab_focus()
		return
	round_number += 1
	shield = 0
	energy = 3
	_deal()


func _finish(take: bool) -> void:
	if phase != "reward":
		return
	if take:
		discard.add_card(_create_card("lunge"))
	phase = "done"
	_update_hud()
	buttons.restart.grab_focus()


func _update_hud() -> void:
	labels.player.text = "Hudson   %s HP  ·  %s Block" % [hp, shield]
	labels.enemy.text = "Bramble   %s HP%s" % [enemy_hp, "  ·  %s Block" % enemy_block if enemy_block else ""]
	labels.draw.text = "Draw  %s" % draw_pile.get_card_count()
	labels.discard.text = "Discard  %s" % discard.get_card_count()
	if phase == "battle":
		var intent := "Attack 9" if round_number % 2 else "Guard 6"
		labels.status.text = "Round %s  ·  Energy %s / 3  ·  Intent: %s" % [round_number, energy, intent]
	elif phase == "reward":
		labels.status.text = "Bramble defeated. Add Briar Lunge to your deck?"
	elif phase == "done":
		labels.status.text = "Clearing complete."
	else:
		labels.status.text = "The woods close in."
	buttons.turn.visible = phase == "battle"
	buttons.draft.visible = phase == "reward"
	buttons.skip.visible = phase == "reward"
	buttons.restart.visible = phase in ["defeat", "done"]
