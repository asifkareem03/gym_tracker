export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function formatWeight(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(1)} kg`;
}

export function formatCm(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(1)} cm`;
}

export function formatDiff(diff, unit = '') {
  if (diff === 0 || diff === null || diff === undefined || isNaN(diff)) return '0 ' + unit;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)} ${unit}`.trim();
}
