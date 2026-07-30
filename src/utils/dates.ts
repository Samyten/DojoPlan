const locale = 'fr-FR';

const dateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const courseDateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat(locale, {
  month: 'long',
  year: 'numeric',
});

const timestampFormatter = new Intl.DateTimeFormat(locale, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const forumTimestampFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateLabel(date: string) {
  return dateFormatter.format(parseLocalDate(date));
}

export function formatLongDate(date: string) {
  return longDateFormatter.format(parseLocalDate(date));
}

export function formatTimestamp(timestamp: string) {
  return timestampFormatter.format(new Date(timestamp));
}

export function formatForumTimestamp(timestamp: string) {
  return forumTimestampFormatter.format(new Date(timestamp));
}

export function formatCourseDate(date: string) {
  return courseDateFormatter.format(parseLocalDate(date));
}

export function formatMonthTitle(date: Date) {
  return monthFormatter.format(date);
}

export function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function startOfWeek(date: Date) {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = nextDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(nextDate, mondayOffset);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function compareSessionDateTime(
  left: { date: string; startTime: string },
  right: { date: string; startTime: string },
) {
  return `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`);
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function formatTime(time: string) {
  return time.replace(':', 'h');
}
