extends Button

var card: Card
var allow_drag: Callable


func _get_drag_data(_at: Vector2) -> Variant:
	if not allow_drag.call(card):
		return null
	var preview := Label.new()
	preview.text = card.card_name
	preview.add_theme_color_override("font_color", Color("#ffdaad"))
	set_drag_preview(preview)
	return card
