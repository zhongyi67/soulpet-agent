function datePart(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function shouldEmitTickMessage({ state, now = new Date().toISOString() }) {
  const last = state.lastProactiveAt ? Date.parse(state.lastProactiveAt) : 0;
  const current = Date.parse(now);
  const intervalMs = (state.proactiveIntervalMinutes ?? 180) * 60 * 1000;
  return current - last >= intervalMs;
}

export function getSentTodayCount({ state, now = new Date().toISOString() }) {
  const today = datePart(now);
  return state.sentToday?.date === today ? state.sentToday.count : 0;
}

export function markProactiveSent({ state, now = new Date().toISOString() }) {
  const today = datePart(now);
  const currentCount = state.sentToday?.date === today ? state.sentToday.count : 0;
  return {
    ...state,
    lastProactiveAt: now,
    sentToday: { date: today, count: currentCount + 1 }
  };
}
