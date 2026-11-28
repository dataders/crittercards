import { CARDS, COMPANION_ABILITIES } from './data.mjs';

// Each move pairs a caster gesture with artwork, a palette, and a travel pattern.
const cards = {
  chorusPrelude: ['howl', 'orbit', '#e0caff', '♩'],
  crescendo: ['howl', 'wave', '#b8d6ff', '♬'],
  hollowRefrain: ['howl', 'hex', '#bca7e8', '♫'],
  shatteringNote: ['howl', 'impact', '#e6c1f3', '✷'],
  starChart: ['cast', 'orbit', '#ffe6a3', '✴'],
  cometTrail: ['leap', 'fall', '#ffb572', '✶'],
  starlitShelter: ['brace', 'wall', '#e3d2ff', '✧'],
  guidingRay: ['cast', 'bolt', '#ffefaa', '☼'],
  fireflySpark: ['cast', 'orbit', '#e9f68d', '✧'],
  moonwoodCache: ['brace', 'rise', '#aeb9ff', '☾'],
  briarChannel: ['cast', 'rise', '#aee371', '❧'],
  lanternStrike: ['dash', 'bolt', '#ffd984', '✦'],
  rootwell: ['brace', 'wall', '#87d69c', '♧'],
  twinLanterns: ['cast', 'orbit', '#ffcc72', '✶'],
  mothBargain: ['leap', 'swarm', '#d6b7fa', 'ʚɞ'],
  lastEmber: ['cast', 'rise', '#f49265', '♦'],
  starwell: ['cast', 'orbit', '#a6d8ff', '⋆'],
  venomSalve: ['cast', 'swarm', '#a8e273', '●'],
  venomFang: ['peck', 'slash', '#99ef59', '❯'],
  rootBrace: ['stomp', 'wall', '#b0cb74', '❧'],
  shieldBash: ['stomp', 'impact', '#c1d7ff', '◆'],
  graveOmen: ['cast', 'hex', '#e1aafd', '◈'],
  graveBreaker: ['stomp', 'fall', '#b9a5ff', '✢'],
  boneBulwark: ['brace', 'wall', '#e9dfc8', '✚'],
  grimResolve: ['howl', 'rise', '#deb2f8', '⬆'],
  shieldWall: ['brace', 'swarm', '#71dbad', '◆'],
  witchHex: ['cast', 'hex', '#f1b8fb', '✺'],
  cuttingChorus: ['howl', 'wave', '#d9c6ff', '♪'],
  secretStar: ['cast', 'fall', '#ffe3a1', '★'],
  strike: ['dash', 'slash', '#ffd0a5', '╱'],
  guard: ['brace', 'wall', '#a6ddf7', '⬟'],
  cover: ['brace', 'orbit', '#a9e7e5', '⬡'],
  mark: ['peck', 'hex', '#ffd090', '◎'],
  jab: ['peck', 'bolt', '#f7dfa4', '•'],
  brace: ['brace', 'impact', '#b3d4f1', '◇'],
  lunge: ['leap', 'slash', '#a8e38e', '❯'],
  barricade: ['stomp', 'wall', '#88c389', '♜'],
  ghostfire: ['cast', 'bolt', '#8bd4ff', '♨'],
  moonkick: ['kick', 'slash', '#c6e4ff', '☾'],
  tombguard: ['stomp', 'wall', '#a9b7ce', '⬟'],
  nightshriek: ['howl', 'wave', '#d1bbf7', '◌'],
  pilfer: ['dash', 'return', '#badbfd', '◇'],
  hoard: ['cast', 'return', '#fce18d', '✶'],
  barrowcharge: ['stomp', 'impact', '#dcb77c', '▰'],
  harry: ['dash', 'slash', '#ffab85', '»'],
  cleave: ['kick', 'slash', '#9ee8a7', '⟋'],
  bite: ['peck', 'impact', '#f6a2ac', '⟡'],
  armor: ['brace', 'wall', '#b9df7b', '▥'],
  sharpen: ['dash', 'hex', '#f0cb78', '✛'],
  renew: ['cast', 'rise', '#a0eed1', '☽'],
  rush: ['dash', 'bolt', '#d6c3ff', '›'],
  howl: ['howl', 'orbit', '#ffd5a2', ')))'],
  expose: ['cast', 'hex', '#ffbf86', '⊙'],
  brittle: ['peck', 'hex', '#a9def8', '⋮'],
  flurry: ['kick', 'slash', '#f0c28e', '⫽'],
  circle: ['cast', 'orbit', '#9ad88c', '❦'],
  crownfall: ['stomp', 'fall', '#ffbc69', '♛'],
  spark: ['cast', 'bolt', '#ffac74', '✷'],
  ward: ['cast', 'wall', '#b3dafb', '◇'],
  thorns: ['leap', 'wave', '#90df90', '✳'],
  moonmend: ['cast', 'rise', '#b8eaff', '+'],
  avalanche: ['stomp', 'fall', '#d7c9b6', '⬢'],
  sanctuary: ['brace', 'orbit', '#b9ef92', '✿'],
  thornbreak: ['kick', 'return', '#aee0a4', '✴'],
  undertow: ['cast', 'wave', '#7ae5ee', '∿'],
  lastWord: ['howl', 'impact', '#ebacf1', '✵'],
  mouseSignature: ['dash', 'wall', '#c7e7ce', '◇'],
  squirrelSignature: ['brace', 'rise', '#f6d79d', '❉'],
  frogSignature: ['howl', 'rise', '#8ae5b9', '✚'],
  weaselSignature: ['dash', 'slash', '#e5edd0', '⟋'],
  hedgehogSignature: ['brace', 'orbit', '#afc37d', '✵'],
  batSignature: ['howl', 'wave', '#af9cf3', '◎'],
  crowSignature: ['peck', 'return', '#afd8fa', '◈'],
  heronSignature: ['peck', 'bolt', '#90ece4', '⟶'],
  otterSignature: ['kick', 'wave', '#93eaff', '≈'],
  moleSignature: ['burrow', 'impact', '#ccab88', '◆'],
  porcupineSignature: ['stomp', 'swarm', '#efc49b', '⤴'],
  skunkSignature: ['cast', 'swarm', '#c9b3e3', '☁'],
  coyoteSignature: ['dash', 'hex', '#f9b881', '⊙'],
  beaverSignature: ['stomp', 'wall', '#d4b587', '▥'],
  turtleSignature: ['brace', 'wall', '#9cddbd', '⬢'],
  salamanderSignature: ['cast', 'bolt', '#ffaf83', '♨'],
  viperSignature: ['peck', 'slash', '#a5e284', '⌄'],
  mothSignature: ['leap', 'orbit', '#c5c4ff', '✧'],
  lynxSignature: ['leap', 'fall', '#b1edff', '❄'],
  stagSignature: ['brace', 'orbit', '#bee79a', '♧'],
  bearSignature: ['stomp', 'wave', '#d7cbb4', '⬣'],
  wolverineSignature: ['peck', 'impact', '#fba788', '⟩'],
};

const companions = {
  fox: ['leap', 'slash', '#ff945f', '✷'],
  hare: ['kick', 'slash', '#c2d8ff', '☽'],
  badger: ['stomp', 'wall', '#d7b895', '◆'],
  owl: ['peck', 'hex', '#d4bbff', '◉'],
  raccoon: ['dash', 'return', '#b0d9f6', '▰'],
  magpie: ['leap', 'return', '#ffe589', '✧'],
  boar: ['stomp', 'impact', '#eea474', '▸'],
  wolf: ['dash', 'slash', '#e2c9b3', '❯'],
  mouse: ['dash', 'wall', '#b8e5d7', '◈'],
  squirrel: ['leap', 'return', '#efc184', '◍'],
  frog: ['leap', 'rise', '#91e4aa', '+'],
  weasel: ['dash', 'bolt', '#eee6c7', '⟶'],
  hedgehog: ['brace', 'orbit', '#b2dd94', '✳'],
  bat: ['howl', 'wave', '#b8b0f2', '◌'],
  crow: ['peck', 'return', '#9ecbff', '✦'],
  heron: ['peck', 'bolt', '#a2e7df', '➤'],
  otter: ['kick', 'wave', '#86daf5', '∿'],
  mole: ['burrow', 'impact', '#cba984', '◕'],
  porcupine: ['stomp', 'swarm', '#e8d1a4', '↗'],
  skunk: ['howl', 'swarm', '#c5b2df', '●'],
  coyote: ['dash', 'hex', '#ffca96', '◎'],
  beaver: ['stomp', 'wall', '#d3ac7b', '▤'],
  turtle: ['brace', 'impact', '#9ddcb6', '⬡'],
  salamander: ['cast', 'rise', '#ffb581', '♨'],
  viper: ['peck', 'swarm', '#a2e77d', '♦'],
  moth: ['leap', 'orbit', '#e2d0fe', '⋆'],
  lynx: ['leap', 'slash', '#b4e9ff', '❄'],
  stag: ['brace', 'wall', '#d6e8ab', '♧'],
  bear: ['stomp', 'impact', '#ecc08c', '✸'],
  wolverine: ['peck', 'slash', '#ffc291', '⟋'],
};

const rivals = {
  attack: ['dash', 'slash', '#ff9676', '╱'],
  frailAttack: ['peck', 'hex', '#dbb2ec', '✢'],
  teamAttack: ['howl', 'wave', '#ffc090', '»'],
  guard: ['brace', 'wall', '#b6d5f2', '⬟'],
  mendRivals: ['cast', 'rise', '#a2e0a4', '+'],
  rally: ['howl', 'orbit', '#ffc373', '⬆'],
  shadowWard: ['brace', 'wall', '#b8a5e9', '◈'],
  crownCurse: ['cast', 'hex', '#ef9ccd', '♛'],
  eclipse: ['cast', 'fall', '#c4adfb', '●'],
  openingSurge: ['stomp', 'wave', '#76e3f3', '∿'],
  poison: ['recoil', 'swarm', '#b5e17e', '●'],
};

const support = {
  heal: ['cast', 'rise', '#a2ecc1', '+'],
  block: ['brace', 'wall', '#a9dcff', '⬡'],
  energy: ['cast', 'orbit', '#ffda87', '✦'],
  strength: ['howl', 'rise', '#f9a379', '⬆'],
};

const moveProfiles = { card: cards, companion: companions, rival: rivals };

export function moveProfile(kind, move) {
  const profiles = Object.hasOwn(moveProfiles, kind) ? moveProfiles[kind] : null;
  const id = typeof move === 'string' ? move.replace(/\+$/, '') : '';
  return profiles && Object.hasOwn(profiles, id) ? profiles[id] : null;
}

export function freshCombatEffects(before, after) {
  if (!before || before.phase !== 'combat' || !after || before === after ||
      before.runId !== after.runId || before.encounter !== after.encounter || !Array.isArray(after.combatEffects)) return [];
  const last = Array.isArray(before.combatEffects) ? before.combatEffects.at(-1)?.id ?? 0 : 0;
  return after.combatEffects.filter((effect) => effect?.id > last && moveProfile(effect.kind, effect.move)).slice(-12);
}

export function captureCombatActors(root) {
  const actors = new Map();
  const capture = (key, image, critter) => {
    if (!image || actors.has(key)) return;
    const rect = image.getBoundingClientRect();
    const clip = image.closest('.arena-scroll')?.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (!rect.width || !rect.height || x < 0 || x > innerWidth || y < 0 || y > innerHeight ||
        (clip && (y < clip.top || y > clip.bottom))) return;
    actors.set(key, { image, critter, x, y, width: rect.width, height: rect.height });
  };
  root.querySelectorAll('[data-familiar-seat]').forEach((node) => capture('p' + node.dataset.familiarSeat, node.querySelector('img'), node.dataset.critter));
  root.querySelectorAll('[data-hud-seat]').forEach((node) => capture('p' + node.dataset.hudSeat, node.querySelector('.hud-portrait img'), node.dataset.critter));
  root.querySelectorAll('.battle-companion').forEach((node) => capture('c' + node.dataset.companionSeat, node.querySelector('img')));
  root.querySelectorAll('.rival-card').forEach((node) => capture('r' + node.dataset.index, node.querySelector('.unit-art img')));
  return actors;
}

function overlay(className, at, color) {
  const node = document.createElement('span');
  node.className = className;
  node.style.left = at.x + 'px';
  node.style.top = at.y + 'px';
  node.style.setProperty('--move-color', color);
  node.setAttribute('aria-hidden', 'true');
  document.body.append(node);
  return node;
}

function animateOverlay(node, frames, duration, delay) {
  const animation = node.animate(frames, { duration, delay, easing: 'ease-out' });
  animation.finished.then(() => node.remove(), () => node.remove());
}

const poses = {
  dash: [-.27, .03, 1, 0, -8],
  peck: [-.12, -.08, .57, 7, 13],
  leap: [-.24, .12, .88, -33, -16],
  kick: [-.18, -.09, .69, -18, 21],
  stomp: [-.15, -.14, .75, 6, 5],
  cast: [-.08, -.19, .20, -9, -6],
  brace: [-.18, .25, -.06, 4, 4],
  howl: [-.10, .05, .14, -16, 10],
  burrow: [-.16, .46, .88, 2, -9],
  recoil: [0, .08, -.25, 0, 7],
  wardCast: [-.18, .24, .28, -3, 5],
  boneCast: [-.34, -.11, .47, -7, -13],
  chorusCast: [-.11, -.12, .10, -22, 12],
  starCast: [-.10, .12, .15, -26, -9],
};

function animateActor(actor, target, pose, color, delay, companion) {
  const dx = target ? target.x - actor.x : 28;
  const dy = target ? target.y - actor.y : 0;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const [windback, squash, launch, lift, tilt] = poses[pose];
  const detached = !actor.image.isConnected;
  let node = actor.image.parentElement;
  if (detached || companion) {
    const shell = overlay('combat-move-actor', actor, color);
    const mutation = actor.image.parentElement?.dataset.mutation;
    if (mutation) shell.dataset.mutation = mutation;
    const img = document.createElement('img');
    img.src = companion ? 'assets/' + companion + '.webp' : actor.image.currentSrc || actor.image.src;
    img.alt = '';
    shell.append(img);
    shell.style.width = (companion ? Math.min(72, Math.max(42, actor.width)) : Math.min(150, actor.width)) + 'px';
    shell.style.height = (companion ? Math.min(72, Math.max(42, actor.height)) : Math.min(150, actor.height)) + 'px';
    node = shell;
  }
  const reach = Math.min(companion ? 150 : 44, distance * (companion ? .70 : .33));
  const x = dx / distance * reach;
  const y = dy / distance * reach * .55;
  const direction = Math.sign(x) || 1;
  const frame = (moveX, moveY, rotation, stretch, height) => ({
    transform: 'translate(' + moveX + 'px,' + moveY + 'px) rotate(' + rotation + 'deg) scale(' + stretch + ',' + height + ')',
  });
  const frames = [
    { ...frame(0, 0, 0, 1, 1), opacity: companion ? .2 : 1 },
    { ...frame(x * windback, y * windback, -tilt * .4 * direction, 1 + squash * .24, 1 - squash), opacity: 1, offset: .25 },
    { ...frame(x * launch, y * launch + lift, tilt * direction, 1 + launch * .09, 1 - launch * .04), opacity: 1, offset: .49 },
    { ...frame(0, 0, 0, 1, 1), opacity: companion ? 0 : 1 },
  ];
  if (detached || companion) animateOverlay(node, frames, 420, delay);
  else node.animate(frames, { duration: 365, delay, easing: 'ease-out' });
}

const impacts = {
  orbit: [[-23, 0], [0, -22], [23, 0], [0, 22]],
  rise: [[-13, -20], [12, -26], [0, -42]],
  swarm: [[-17, -14], [17, -22], [12, 12], [-13, 14], [0, -34]],
  impact: [[-21, 15], [20, 15], [0, -23]],
  fall: [[-23, 14], [25, 16], [0, -19]],
  slash: [[-15, 13], [12, -13]],
  wave: [[-18, 8], [18, -8], [0, 17]],
  hex: [[-18, 0], [18, 0], [0, -21]],
  wall: [[-18, 8], [18, 8], [0, -19]],
  return: [[-9, -13], [12, 10]],
  bolt: [[-12, -9], [12, 12]],
};

function animateMotif(source, target, profile, delay, secondary = false) {
  const [, shape, color, glyph] = profile;
  const dx = source ? source.x - target.x : 0;
  const dy = source ? source.y - target.y : 0;
  const travelling = source && Math.hypot(dx, dy) > 18;
  const scale = secondary ? .65 : Math.min(1.30, Math.max(.9, target.width / 80));
  const main = overlay('combat-move combat-move-' + shape, target, color);
  main.textContent = glyph;
  const falling = shape === 'fall';
  const leaves = shape === 'return' && travelling;
  const startsAtCaster = travelling && !falling && !leaves && !['rise', 'wall', 'orbit'].includes(shape);
  const translated = (x, y, zoom, rotate = 0) => 'translate(' + x + 'px,' + y + 'px) scale(' + zoom + ') rotate(' + rotate + 'deg)';
  const start = falling ? translated(-20, -Math.min(94, target.y * .7), .5, -25)
    : startsAtCaster ? translated(dx, dy, .38)
    : translated(0, shape === 'rise' || shape === 'wall' ? 19 : 0, .47);
  const end = leaves ? translated(dx, dy, .42) : translated(0, shape === 'rise' ? -36 : 0, scale * 1.43, shape === 'orbit' ? 65 : 8);
  const duration = falling ? 520 : startsAtCaster ? 440 : 375;
  const landing = falling || startsAtCaster ? .48 : .32;
  animateOverlay(main, [
    { transform: start, opacity: 0 },
    { opacity: .95, offset: .17 },
    { transform: translated(0, 0, scale, shape === 'slash' ? -18 : 0), opacity: 1, offset: landing },
    { transform: end, opacity: 0 },
  ], duration, delay);
  if (secondary) return;
  impacts[shape].forEach(([x, y], index) => {
    const mote = overlay('combat-move-mote', target, color);
    mote.textContent = shape === 'fall' || shape === 'orbit' ? '✧' : '•';
    animateOverlay(mote, [
      { transform: translated(0, 0, .45), opacity: 1 },
      { transform: translated(x * scale, y * scale, .9), opacity: .85, offset: .45 },
      { transform: translated(x * scale * 1.45, y * scale * 1.45, .3), opacity: 0 },
    ], 250, delay + duration * landing + index * 13);
  });
}

const cousinStyles = {
  hudson: { signature: 'shieldWall', pose: 'wardCast', color: '#86e4a2', crest: '❧' },
  quinn: { signature: 'witchHex', pose: 'boneCast', color: '#eab7ff', crest: '◇' },
  alba: { signature: 'cuttingChorus', pose: 'chorusCast', color: '#d9c5ff', crest: '♫' },
  tita: { signature: 'secretStar', pose: 'starCast', color: '#ffe39a', crest: '✦' },
};

const castingPoses = new Set(['cast', 'howl', 'brace']);

function signatureCue(at, style, shape, glyph, points, duration, delay) {
  const node = overlay('combat-move cousin-signature cousin-signature-' + shape, at, style.color);
  node.textContent = glyph;
  animateOverlay(node, points.map(([x, y, scale, angle, opacity, offset]) => ({
    transform: 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ') rotate(' + angle + 'deg)',
    opacity, offset,
  })), duration, delay);
}

function animateSignature(cousin, source, targets, delay) {
  const style = cousinStyles[cousin];
  const radius = Math.min(44, Math.max(16, source.width * .47));
  signatureCue(source, style, cousin, style.crest, [
    [0, radius, .48, -18, 0, 0], [0, 0, 1, 0, .94, .36], [0, -radius * .58, 1.25, 12, 0, 1],
  ], 440, delay);

  for (const [beat, target] of targets.entries()) {
    if (!target) continue;
    const dx = source.x - target.x;
    const dy = source.y - target.y;
    const start = delay + 110 + beat * 92;
    if (cousin === 'hudson') {
      for (const [index, arc] of [-34, -10, 15].entries()) {
        signatureCue(target, style, 'venom', '', [
          [dx, dy, .42, 0, 0, 0], [dx * .45, dy * .45 + arc, .8, 0, .9, .42],
          [0, 0, 1, 0, 1, .71], [arc * .40, 17, .55, 0, 0, 1],
        ], 360, start + index * 42);
      }
    } else if (cousin === 'quinn') {
      for (const sign of [-1, 1]) {
        signatureCue(target, style, 'bone', '', [
          [sign * 36, -26, .55, sign * 56, 0, 0], [0, 0, 1, sign * 39, .96, .47],
          [sign * 3, 4, 1.15, sign * 46, .72, .71], [sign * 10, 13, .8, sign * 70, 0, 1],
        ], 415, start + 45);
      }
    } else if (cousin === 'alba') {
      for (const [index, note] of ['♪', '♫', '♬'].entries()) {
        const crest = index % 2 ? 24 : -25;
        signatureCue(target, style, 'note', note, [
          [dx * .83, dy * .83, .55, -18, 0, 0], [dx * .38, dy * .38 + crest, .91, 9, .98, .45],
          [0, 0, 1, 0, .88, .75], [index * 7, -24, 1.10, 18, 0, 1],
        ], 385, start + index * 53);
      }
    } else if (cousin === 'tita') {
      const height = Math.min(115, target.y * .7);
      for (const [index, tail] of [-29, -15, 2].entries()) {
        signatureCue(target, style, 'comet', index === 0 ? '✦' : '✧', [
          [tail - 23, -height, .46, -17, 0, 0], [tail * .75, -height * .56, .78, -8, .94, .45],
          [0, -3, 1.05, 0, .86, .7], [-tail * .6, 24, .52, 15, 0, 1],
        ], 420, start + index * 38);
      }
    }
  }
}

export function playCombatEffects(effects, before, after) {
  const actorAt = (key) => after.get(key) ?? before.get(key);
  effects.forEach(({ kind, move, actor, targets, support: benefits }, index) => {
    const profile = moveProfile(kind, move);
    const moveId = kind === 'card' ? move.replace(/\+$/, '') : move;
    const card = kind === 'card' ? CARDS[move] : kind === 'companion' ? COMPANION_ABILITIES[moveId] : null;
    const mainActor = actorAt((kind === 'rival' ? 'r' : 'p') + actor);
    const companion = kind === 'companion' ? actorAt('c' + actor) : null;
    const source = companion ?? mainActor;
    const targetSide = kind !== 'rival' || move === 'mendRivals' ? 'r' : 'p';
    const targetList = Array.isArray(targets) ? targets : [];
    // Consecutive hits on the same rival share an anchor. Keep at least one beat for each rival.
    const beats = targetList.filter((seat, i) => i < 3 || seat !== targetList[i - 1]).slice(0, 6);
    const aim = beats.map((seat) => actorAt(targetSide + seat));
    const delay = index * 110;
    const actualCompanion = kind === 'companion' && source && (companion || !source.image.getAttribute('src')?.endsWith('/' + moveId + '.webp'));
    const cousin = kind === 'card' && source?.critter;
    const style = Object.hasOwn(cousinStyles, cousin) ? cousinStyles[cousin] : null;
    const signature = style?.signature === moveId;
    const pose = style && (signature || castingPoses.has(profile[0])) ? style.pose : profile[0];
    if (source) animateActor(source, aim.find(Boolean), pose, profile[2], delay, actualCompanion ? moveId : null);
    if (signature) animateSignature(cousin, source, [...new Set(aim)].slice(0, 2), delay);
    if (aim.length) {
      aim.forEach((target, hit) => {
        if (target) animateMotif(source, target, profile, delay + 70 + hit * 92);
      });
    } else if (source) {
      animateMotif(source, source, profile, delay + 70);
    }
    if (card && Array.isArray(benefits)) {
      benefits.slice(0, 6).forEach(({ seat, effect }, beat) => {
        const target = actorAt('p' + seat);
        if (target && (aim.length || seat !== actor) && Object.hasOwn(support, effect)) {
          animateMotif(source, target, support[effect], delay + 145 + beat * 55, true);
        }
      });
    }
  });
}
