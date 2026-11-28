extends SceneTree

const BattleScene = preload("res://battle.tscn")


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var battle := BattleScene.instantiate()
	root.add_child(battle)
	var valid: bool = battle.hand.get_card_count() == 5 and battle.draw_pile.get_card_count() == 10
	for _round in range(5):
		for card in battle.hand.cards_node.get_children():
			var before: int = battle.discard.get_card_count()
			if battle._can_play(card):
				battle._play(card)
				valid = valid and battle.discard.get_card_count() == before + 1
		if battle.phase != "battle":
			break
		battle._end_turn()
	valid = valid and battle.phase == "reward"
	battle._finish(true)
	valid = valid and battle.phase == "done"
	valid = valid and battle.hand.get_card_count() + battle.draw_pile.get_card_count() + battle.discard.get_card_count() == 16
	battle._start()
	valid = valid and battle.phase == "battle" and battle.hand.get_card_count() == 5
	if not valid:
		printerr("Failed single-fight smoke test.")
		quit(1)
		return
	print("PASS: dealt five cards, played and discarded, won, took a reward, replayed.")
	quit()
