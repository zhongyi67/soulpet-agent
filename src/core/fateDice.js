import crypto from 'node:crypto';

export function classifyFateRoll(roll) {
  if (!Number.isInteger(roll) || roll < 1 || roll > 100) {
    throw new RangeError('fate roll must be an integer from 1 to 100');
  }
  if (roll <= 5) return 'calamity';
  if (roll <= 20) return 'danger';
  if (roll <= 50) return 'ordinary';
  if (roll <= 80) return 'smooth';
  if (roll <= 95) return 'lucky';
  return 'miracle';
}

export function createSeededDice(seed) {
  let counter = 0;
  const seedText = String(seed ?? 'soulpet');

  return {
    roll100() {
      const hash = crypto
        .createHash('sha256')
        .update(`${seedText}:${counter++}`)
        .digest();
      const value = hash.readUInt32BE(0);
      return (value % 100) + 1;
    },
    rollAll() {
      const exploration = this.roll100();
      const danger = this.roll100();
      const treasure = this.roll100();
      const vitality = this.roll100();
      const fate = this.roll100();
      return {
        exploration,
        danger,
        treasure,
        vitality,
        fate,
        fateTier: classifyFateRoll(fate)
      };
    }
  };
}
