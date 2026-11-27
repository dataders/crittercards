export function createCombatInput(game, playCombatMove) {
  let attackDrag;
  let aimedMove;
  let suppressDragClick = false;
  const livingRival = '[data-do="target"]:not(:disabled)';

  function setAimedMove(control) {
    if (aimedMove === control) return;
    aimedMove?.setAttribute('aria-pressed', 'false');
    aimedMove = control;
    const aiming = Boolean(control);
    control?.setAttribute('aria-pressed', 'true');
    game.classList.toggle('is-choosing-target', aiming);
    game.querySelector('#aim-status').textContent = aiming ? `${control.dataset.aim} selected. Choose a highlighted rival.` : '';
    game.querySelector('[data-do="cancel-aim"]').hidden = !aiming;
    for (const rival of game.querySelectorAll(livingRival)) rival.tabIndex = aiming ? 0 : -1;
  }

  function cancelAim() {
    const source = aimedMove ?? attackDrag?.source;
    clearAttackDrag();
    setAimedMove();
    source?.focus();
  }

  function combatDropTarget(drag, x, y) {
    return document.elementFromPoint(x, y)?.closest(drag.targeted ? livingRival : '[data-block-drop]');
  }

  function clearAttackDrag() {
    if (!attackDrag) return;
    const { source, pointerId, preview, dropTarget, frame } = attackDrag;
    attackDrag = undefined;
    cancelAnimationFrame(frame);
    preview?.remove();
    dropTarget?.classList.remove('is-drop-target');
    source.classList.remove('is-aiming');
    game.classList.remove('is-drag-aiming', 'is-drag-blocking');
    if (source.hasPointerCapture(pointerId)) source.releasePointerCapture(pointerId);
  }

  function drawAttackDrag() {
    const drag = attackDrag;
    const { scrollPane } = drag;
    const { top, bottom, height } = scrollPane.getBoundingClientRect();
    if (drag.targeted && drag.y >= top && drag.y <= bottom) {
      const edge = Math.min(48, height / 4);
      const scrollDistance = Math.min(0, drag.y - top - edge) + Math.max(0, drag.y - bottom + edge);
      if (scrollDistance) scrollPane.scrollTop += Math.sign(scrollDistance) * Math.min(14, Math.abs(scrollDistance) / 3);
    }
    const dropTarget = combatDropTarget(drag, drag.x, drag.y);
    if (dropTarget !== drag.dropTarget) {
      drag.dropTarget?.classList.remove('is-drop-target');
      dropTarget?.classList.add('is-drop-target');
      drag.dropTarget = dropTarget;
    }
    const halfWidth = drag.preview.offsetWidth / 2;
    drag.preview.style.left = `${Math.max(halfWidth, Math.min(drag.x, window.innerWidth - halfWidth))}px`;
    drag.preview.style.top = `${drag.y}px`;
    drag.preview.classList.toggle('is-below-pointer', drag.y < drag.preview.offsetHeight + 12);
    drag.frame = requestAnimationFrame(drawAttackDrag);
  }

  window.addEventListener('pointerdown', (event) => {
    if (event.isPrimary && event.button === 0) suppressDragClick = false;
  }, true);

  window.addEventListener('click', (event) => {
    if (!suppressDragClick || event.detail === 0) return;
    suppressDragClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  game.addEventListener('pointerdown', (event) => {
    const source = event.target.closest(':is([data-aim], [data-block-drag]):not(:disabled)');
    if (!source || !event.isPrimary || event.button !== 0 || attackDrag) return;
    const { pointerId, clientX: x, clientY: y } = event;
    const stage = source.closest('.game-stage');
    const scrollPane = getComputedStyle(stage).overflowY === 'auto' ? stage : game.querySelector('.arena-scroll');
    attackDrag = { source, scrollPane, targeted: source.hasAttribute('data-aim'), pointerId, startX: x, startY: y, x, y };
    source.setPointerCapture(pointerId);
  });

  window.addEventListener('pointermove', (event) => {
    const drag = attackDrag;
    if (drag?.pointerId !== event.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (drag.preview || Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 8) return;
    suppressDragClick = true;
    setAimedMove();
    drag.preview = document.createElement('div');
    drag.preview.className = 'attack-preview';
    drag.preview.setAttribute('aria-hidden', 'true');
    drag.preview.textContent = drag.source.dataset.aim ?? drag.source.dataset.blockDrag;
    document.body.append(drag.preview);
    drag.source.classList.add('is-aiming');
    game.classList.add(drag.targeted ? 'is-drag-aiming' : 'is-drag-blocking');
    drawAttackDrag();
  });

  window.addEventListener('pointerup', (event) => {
    const drag = attackDrag;
    if (drag?.pointerId !== event.pointerId) return;
    const target = drag.preview && combatDropTarget(drag, event.clientX, event.clientY);
    clearAttackDrag();
    if (target) playCombatMove(drag.source, drag.targeted ? Number(target.dataset.index) : undefined);
  });

  window.addEventListener('pointercancel', (event) => {
    if (attackDrag?.pointerId === event.pointerId) clearAttackDrag();
  });
  window.addEventListener('lostpointercapture', (event) => {
    if (attackDrag?.pointerId === event.pointerId && attackDrag.source === event.target) clearAttackDrag();
  });
  window.addEventListener('blur', clearAttackDrag);

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || (!aimedMove && !attackDrag?.preview)) return;
    event.preventDefault();
    cancelAim();
  });

  function selectTarget(control, clickCount, index) {
    const action = control.dataset.do;
    if (control.hasAttribute('data-aim')) {
      if (aimedMove === control) return cancelAim();
      const firstRival = game.querySelector(livingRival);
      if (!firstRival) return;
      setAimedMove(control);
      if (clickCount === 0) firstRival.focus();
      else firstRival.closest('.battlefield').scrollIntoView({ block: 'nearest' });
      return;
    }
    if (action === 'cancel-aim') return cancelAim();
    if (action === 'target') {
      if (!aimedMove) return;
      const source = aimedMove;
      setAimedMove();
      if (clickCount === 0) source.focus({ preventScroll: true });
      return playCombatMove(source, index);
    }
  }

  return { clearAttackDrag, setAimedMove, selectTarget };
}
