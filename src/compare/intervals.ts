import { DateTime } from 'luxon';
import type { BusyInterval, CompareState, SingleState, ViewMode } from '../types.ts';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
  TIMEZONE,
} from '../types.ts';

export function mergeIntervals(intervals: BusyInterval[]): BusyInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort(
    (a, b) => a.start.toMillis() - b.start.toMillis(),
  );

  const merged: BusyInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      if (current.end > last.end) {
        last.end = current.end;
      }
      if (!last.summary && current.summary) {
        last.summary = current.summary;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function overlaps(
  slotStart: DateTime,
  slotEnd: DateTime,
  interval: BusyInterval,
): boolean {
  return slotStart < interval.end && slotEnd > interval.start;
}

function isBusyAt(
  slotStart: DateTime,
  slotEnd: DateTime,
  intervals: BusyInterval[],
): boolean {
  return intervals.some((iv) => overlaps(slotStart, slotEnd, iv));
}

function findOverlappingEvent(
  slotStart: DateTime,
  slotEnd: DateTime,
  intervals: BusyInterval[],
): BusyInterval | undefined {
  return intervals.find((iv) => overlaps(slotStart, slotEnd, iv));
}

export function getWeekStart(date: DateTime): DateTime {
  const d = date.setZone(TIMEZONE).startOf('day');
  const weekday = d.weekday;
  return d.minus({ days: weekday - 1 });
}

export function classifyCompare(
  busy1: boolean,
  busy2: boolean,
): CompareState {
  if (!busy1 && !busy2) return 'bothFree';
  if (busy1 && !busy2) return 'only1Busy';
  if (!busy1 && busy2) return 'only2Busy';
  return 'bothBusy';
}

export interface SlotInfo {
  compare?: CompareState;
  single?: SingleState;
  tooltip?: string;
}

/** True when two calendars are loaded and every slot (06:00–22:00) is both-free. */
export function isMutualFreeDay(
  slots: SlotInfo[],
  twoCalendars: boolean,
): boolean {
  if (!twoCalendars || slots.length === 0) return false;
  return slots.every((s) => s.compare === 'bothFree');
}

export function buildDaySlots(
  dayStart: DateTime,
  cal1: BusyInterval[] | null,
  cal2: BusyInterval[] | null,
): SlotInfo[] {
  const merged1 = cal1 ? mergeIntervals(cal1) : null;
  const merged2 = cal2 ? mergeIntervals(cal2) : null;
  const twoCal = merged1 !== null && merged2 !== null;
  const slots: SlotInfo[] = [];

  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_MINUTES) {
      const slotStart = dayStart.set({
        hour,
        minute: min,
        second: 0,
        millisecond: 0,
      });
      const slotEnd = slotStart.plus({ minutes: SLOT_MINUTES });

      if (twoCal && merged1 && merged2) {
        const b1 = isBusyAt(slotStart, slotEnd, merged1);
        const b2 = isBusyAt(slotStart, slotEnd, merged2);
        const state = classifyCompare(b1, b2);
        let tooltip: string | undefined;

        if (b1) {
          const ev = findOverlappingEvent(slotStart, slotEnd, merged1);
          if (ev?.summary) tooltip = `Cal 1: ${ev.summary}`;
        }
        if (b2) {
          const ev = findOverlappingEvent(slotStart, slotEnd, merged2);
          const part = ev?.summary ? `Cal 2: ${ev.summary}` : 'Cal 2: busy';
          tooltip = tooltip ? `${tooltip}\n${part}` : part;
        }

        slots.push({ compare: state, tooltip });
      } else {
        const merged = merged1 ?? merged2 ?? [];
        const busy = isBusyAt(slotStart, slotEnd, merged);
        const ev = busy
          ? findOverlappingEvent(slotStart, slotEnd, merged)
          : undefined;
        slots.push({
          single: busy ? 'busy' : 'free',
          tooltip: ev?.summary
            ? `${ev.summary}\n${slotStart.toFormat('HH:mm')} – ${slotEnd.toFormat('HH:mm')}`
            : undefined,
        });
      }
    }
  }

  return slots;
}

export function buildWeekSlots(
  weekStart: DateTime,
  cal1: BusyInterval[] | null,
  cal2: BusyInterval[] | null,
): SlotInfo[][][] {
  const slotsPerHour = 60 / SLOT_MINUTES;
  const days: SlotInfo[][][] = [];

  for (let day = 0; day < 7; day++) {
    const flat = buildDaySlots(weekStart.plus({ days: day }), cal1, cal2);
    const daySlots: SlotInfo[][] = [];

    for (let hi = 0; hi < DAY_END_HOUR - DAY_START_HOUR; hi++) {
      daySlots.push(
        flat.slice(hi * slotsPerHour, (hi + 1) * slotsPerHour),
      );
    }

    days.push(daySlots);
  }

  return days;
}

export function getMonthStart(date: DateTime): DateTime {
  return date.setZone(TIMEZONE).startOf('month');
}

export function getMonthGridDays(monthStart: DateTime): DateTime[] {
  const first = monthStart.startOf('month');
  const last = monthStart.endOf('month');
  const gridStart = getWeekStart(first);
  const gridEnd = getWeekStart(last).plus({ days: 6 });

  const days: DateTime[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = d.plus({ days: 1 });
  }

  return days;
}

function pickInitialAnchor(
  calendars: { intervals: BusyInterval[] }[],
  anchorStart: DateTime,
  anchorEnd: DateTime,
): DateTime {
  const allStarts = calendars.flatMap((c) => c.intervals.map((i) => i.start));
  if (allStarts.length === 0) return anchorStart;

  const earliest = allStarts.reduce((a, b) => (a < b ? a : b));
  const latest = calendars
    .flatMap((c) => c.intervals.map((i) => i.end))
    .reduce((a, b) => (a > b ? a : b));

  if (latest < anchorStart) return earliest;
  if (earliest > anchorEnd) return earliest;
  return anchorStart;
}

export function initialWeekStart(calendars: { intervals: BusyInterval[] }[]): DateTime {
  const now = DateTime.now().setZone(TIMEZONE);
  const weekStart = getWeekStart(now);
  return getWeekStart(
    pickInitialAnchor(calendars, weekStart, weekStart.plus({ days: 6 })),
  );
}

export function initialMonthStart(calendars: { intervals: BusyInterval[] }[]): DateTime {
  const now = DateTime.now().setZone(TIMEZONE);
  const monthStart = now.startOf('month');
  const anchor = pickInitialAnchor(
    calendars,
    monthStart,
    monthStart.endOf('month'),
  );
  return getMonthStart(anchor);
}

export function initialPeriodStart(
  calendars: { intervals: BusyInterval[] }[],
  viewMode: ViewMode,
): DateTime {
  return viewMode === 'month'
    ? initialMonthStart(calendars)
    : initialWeekStart(calendars);
}
