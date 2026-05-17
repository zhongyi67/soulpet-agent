function stageForPoints(points) {
  if (points >= 500) return { level: 5, stage: 'soulbound' };
  if (points >= 300) return { level: 4, stage: 'guardian' };
  if (points >= 150) return { level: 3, stage: 'companion' };
  if (points >= 50) return { level: 2, stage: 'attached' };
  if (points >= 10) return { level: 1, stage: 'firstBond' };
  return { level: 0, stage: 'stranger' };
}

const eventPoints = {
  owner_praise: 8,
  owner_comfort: 12,
  owner_message: 3,
  adventure_return: 15,
  panel_choice: 5,
  revival: 30,
  scolding: -2
};

export function updateBondFromEvent(bond, eventType) {
  const delta = eventPoints[eventType] ?? 0;
  const points = Math.max(0, (bond.points ?? 0) + delta);
  return { ...bond, points, ...stageForPoints(points) };
}

export function getDailyProactiveLimit(bond) {
  const stage = bond.stage ?? stageForPoints(bond.points ?? 0).stage;
  return {
    stranger: 0,
    firstBond: 1,
    attached: 1,
    companion: 2,
    guardian: 3,
    soulbound: 3
  }[stage] ?? 0;
}
