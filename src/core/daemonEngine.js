export function createDueTickEvents({ state, now = new Date().toISOString() }) {
  const last = state.lastProactiveAt ? Date.parse(state.lastProactiveAt) : 0;
  const current = Date.parse(now);
  const intervalMs = (state.proactiveIntervalMinutes ?? 180) * 60 * 1000;
  if (current - last >= intervalMs) return [{ type: 'tick', reason: 'quiet_presence', now }];
  return [];
}

export class Inbox {
  constructor(items = []) {
    this.items = items;
  }

  add(item) {
    const stored = { id: item.id ?? `inbox_${Date.now()}_${this.items.length}`, status: 'pending', createdAt: new Date().toISOString(), ...item };
    this.items.push(stored);
    return stored;
  }

  pending() {
    return this.items.filter((item) => item.status === 'pending');
  }

  resolve(id) {
    const item = this.items.find((candidate) => candidate.id === id);
    if (item) item.status = 'resolved';
    return item;
  }
}
