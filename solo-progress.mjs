import { LEVELS_PER_ACT, TRAIL } from './data.mjs';

export const soloProgressKey = 'crittercards.solo-progress.v1';

export function updateSoloProgress(previous, state) {
  const cleared = state?.players?.length === 1
    ? state.encounter + Number(state.phase === 'reward' || state.phase === 'victory')
    : 0;
  const wonTrials = cleared ? state.path.slice(0, cleared).filter((id, encounter) =>
    TRAIL[encounter]?.some((route) => route.id === id && route.trialReward)).length : 0;
  return {
    bestLevel: Math.max(previous?.bestLevel ?? 0, cleared),
    bestTrials: Math.max(previous?.bestTrials ?? 0, wonTrials),
  };
}

export function soloGoals(progress) {
  return [
    { label: 'Defeat the Act I boss', complete: progress.bestLevel >= LEVELS_PER_ACT },
    { label: 'Win three optional trials in one run', complete: progress.bestTrials >= 3 },
    { label: 'Clear all three acts', complete: progress.bestLevel >= TRAIL.length },
  ];
}
