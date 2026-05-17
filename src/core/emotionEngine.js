function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

const praiseWords = ['真棒', '夸', '可爱', '喜欢', '摸摸', '乖', '厉害', '好'];
const scoldWords = ['笨', '错', '骂', '坏', '失望', '不乖', '讨厌'];
const comfortWords = ['抱抱', '安慰', '没事', '别怕', '陪你'];

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function updateEmotionFromOwnerMessage(emotion, text) {
  const next = { ...emotion };
  if (hasAny(text, praiseWords)) {
    next.joy = clamp((next.joy ?? 0) + 16);
    next.pride = clamp((next.pride ?? 0) + 8);
    next.shyness = clamp((next.shyness ?? 0) + 4);
    next.grievance = clamp((next.grievance ?? 0) - 6);
  }
  if (hasAny(text, comfortWords)) {
    next.joy = clamp((next.joy ?? 0) + 8);
    next.worry = clamp((next.worry ?? 0) - 8);
    next.grievance = clamp((next.grievance ?? 0) - 8);
    next.missing = clamp((next.missing ?? 0) - 4);
  }
  if (hasAny(text, scoldWords)) {
    next.grievance = clamp((next.grievance ?? 0) + 14);
    next.worry = clamp((next.worry ?? 0) + 8);
    next.joy = clamp((next.joy ?? 0) - 8);
    next.pride = clamp((next.pride ?? 0) - 4);
  }
  return next;
}

export function summarizeEmotion(emotion) {
  const sorted = Object.entries(emotion).sort((a, b) => b[1] - a[1]);
  const [name] = sorted[0] ?? ['quiet'];
  return name;
}
