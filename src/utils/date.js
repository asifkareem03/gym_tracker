export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
  } catch (e) {
    return dateStr;
  }
}

export function getTodayDateString(timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

export function isToday(dateStr, timezone = 'UTC') {
  return dateStr === getTodayDateString(timezone);
}

export function isYesterday(dateStr, timezone = 'UTC') {
  const today = getTodayDateString(timezone);
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
  
  const yYear = yesterdayDate.getFullYear();
  const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayDate.getDate()).padStart(2, '0');
  
  return dateStr === `${yYear}-${yMonth}-${yDay}`;
}

export function getRelativeDayLabel(dateStr, timezone = 'UTC') {
  if (isToday(dateStr, timezone)) return 'Today';
  if (isYesterday(dateStr, timezone)) return 'Yesterday';
  return formatDate(dateStr, { month: 'short', day: 'numeric' });
}
