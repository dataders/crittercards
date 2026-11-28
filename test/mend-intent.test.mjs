import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, createRun, getEnemyIntent, TRAIL } from '../game.mjs';
import { intentLabel } from '../views.mjs';

test('Mend previews its rule on the trail and the actual recovery of each injured ally in combat', () => {
  const run = createRun(['fox'], 12);
  run.encounter = 11;
  run.path = Array(11).fill('steady');
  const route = TRAIL[11][0];
  const intent = getEnemyIntent(run, route, 1, 1);
  const rule = 'Heals other living rivals for up to 14 HP each';
  assert.equal(intentLabel(intent, route.enemies[1], run), rule);

  const fight = applyAction(run, { type: 'route', player: 0, routeId: route.id });
  const [patient, healer] = fight.enemies;
  const label = () => intentLabel(healer.intent, healer, fight, true);
  assert.equal(label(), 'Heal up to 14 HP');
  assert.match(intentLabel(healer.intent, healer, fight), /14 HP each · all at full HP/);
  patient.hp -= 3;
  const after = applyAction(fight, { type: 'endTurn', player: 0 });
  assert.equal(after.enemies[0].hp - patient.hp, 3);
  const second = { ...patient, name: 'Second rival', hp: 1 };
  fight.enemies.push(second);
  assert.equal(label(), `${patient.name} +3 HP, Second rival +14 HP`);
  patient.hp = patient.maxHp;
  assert.equal(label(), 'Second rival +14 HP');
  second.hp = patient.hp = 0;
  assert.equal(label(), 'No other rival to mend');
});
