export const setupSelect = '[data-companion-seat]';

export function captureViewState(root) {
  const active = root.contains(document.activeElement) ? document.activeElement : null;
  const details = [...root.querySelectorAll('details[data-view-state]')].map((node) => ({
    key: node.dataset.viewState,
    open: node.open,
    focused: active === node.querySelector('summary'),
  }));
  const field = active?.matches(setupSelect + ', [data-view-field]') ? active : null;
  const draft = root.querySelector('[data-view-field="restore-code"]')?.value;
  return { details, field, draft };
}

export function restoreViewState(root, { details, field, draft }) {
  let focused;
  for (const { key, open, focused: summaryFocused } of details) {
    const match = root.querySelector(`details[data-view-state="${key}"]`);
    if (!match) continue;
    if (match.open !== open) match.open = open;
    if (summaryFocused) focused = match.querySelector('summary');
  }
  if (draft !== undefined) {
    const restoreCode = root.querySelector('[data-view-field="restore-code"]');
    if (restoreCode) restoreCode.value = draft;
  }
  if (!field) return focused;
  const { companionSeat, viewField } = field.dataset;
  if (companionSeat !== undefined) return root.querySelector(`[data-companion-seat="${companionSeat}"]:enabled`);
  const match = root.querySelector(`[data-view-field="${viewField}"]`);
  if (match && match !== field && match.value === field.value) {
    match.setSelectionRange(field.selectionStart, field.selectionEnd, field.selectionDirection);
  }
  return match;
}
