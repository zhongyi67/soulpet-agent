function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function deriveVitalityStatus(state) {
  if (state.spirit <= 0) return 'dormant';
  if (state.spirit <= 20 || state.injury >= 80) return 'critical';
  if (state.spirit <= 45 || state.injury >= 45) return 'wounded';
  if (state.fatigue >= 70) return 'tired';
  return 'healthy';
}

export function applyDamage(state, damage) {
  const next = {
    ...state,
    spirit: clamp((state.spirit ?? 100) - (damage.spiritDamage ?? 0)),
    fatigue: clamp((state.fatigue ?? 0) + (damage.fatigueGain ?? 0)),
    injury: clamp((state.injury ?? 0) + (damage.injuryGain ?? 0)),
    lastDamageReason: damage.reason ?? state.lastDamageReason
  };
  next.status = deriveVitalityStatus(next);
  return next;
}

export function checkDormancy(state, equipment = []) {
  if ((state.spirit ?? 0) > 0 && state.status !== 'dormant') {
    return { dormant: false, preventedBy: null, state };
  }

  const protector = equipment.find((item) =>
    item.effects?.some((effect) => effect.type === 'prevent_dormancy_once')
  );

  if (protector) {
    const protectedState = {
      ...state,
      spirit: Math.max(1, state.spirit ?? 0),
      status: 'critical'
    };
    return { dormant: false, preventedBy: protector.id, state: protectedState };
  }

  return {
    dormant: true,
    preventedBy: null,
    state: { ...state, spirit: 0, status: 'dormant' }
  };
}
