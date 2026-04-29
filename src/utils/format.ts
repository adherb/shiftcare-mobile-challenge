// Parse manually to avoid UTC shift from new Date(isoString).
export function formatDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatTimeForDisplay(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${period}`;
}

export function formatTimezone(tz: string): string {
  const parts = tz.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const country = parts[0];
  return `${city}, ${country}`;
}
