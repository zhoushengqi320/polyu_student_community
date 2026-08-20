const MONTH_LABELS = [
  "1 月",
  "2 月",
  "3 月",
  "4 月",
  "5 月",
  "6 月",
  "7 月",
  "8 月",
  "9 月",
  "10 月",
  "11 月",
  "12 月",
] as const;

export type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function getDefaultDateTimeParts(base = new Date()): DateTimeParts {
  return {
    year: base.getFullYear(),
    month: base.getMonth() + 1,
    day: base.getDate(),
    hour: base.getHours(),
    minute: base.getMinutes(),
  };
}

export function parseIsoToParts(value?: string | null): DateTimeParts | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function partsToIso(parts: DateTimeParts): string {
  const date = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0,
  );
  return date.toISOString();
}

export function formatDateTimeParts(parts: DateTimeParts): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year} 年 ${parts.month} 月 ${parts.day} 日 ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function buildYearOptions(startYear: number, endYear: number): number[] {
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  return years;
}

export function buildDayOptions(year: number, month: number): number[] {
  const totalDays = getDaysInMonth(year, month);
  return Array.from({ length: totalDays }, (_, index) => index + 1);
}

export function buildHourOptions(): number[] {
  return Array.from({ length: 24 }, (_, index) => index);
}

export function buildMinuteOptions(step = 1): number[] {
  const minutes: number[] = [];
  for (let minute = 0; minute < 60; minute += step) {
    minutes.push(minute);
  }
  return minutes;
}

export function addHoursToIso(iso: string, hours: number): string {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export { MONTH_LABELS };
