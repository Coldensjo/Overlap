import ICAL from 'ical.js';
import { DateTime } from 'luxon';
import type { BusyInterval, ParsedCalendar } from '../types.ts';
import { TIMEZONE } from '../types.ts';
import type { Component, Event, Time } from 'ical.js';

/** Expand recurring events within this window (relative to parse time). */
const RANGE_PAST = { months: 3 };
const RANGE_FUTURE = { years: 2 };
const MAX_OCCURRENCES_PER_EVENT = 5_000;

function icalTimeToDateTime(time: Time): DateTime {
  const zone = time.zone?.tzid ?? TIMEZONE;
  const js = time.toJSDate();
  return DateTime.fromJSDate(js, { zone });
}

function getPropertyText(
  component: Component,
  name: string,
): string | undefined {
  const prop = component.getFirstProperty(name);
  if (!prop) return undefined;
  return prop.getFirstValue()?.toString();
}

function shouldSkipEvent(event: Event, vevent: Component): boolean {
  if (event.isRecurrenceException()) return true;
  if (event.status === 'CANCELLED') return true;

  const transp = getPropertyText(vevent, 'transp');
  if (transp === 'TRANSPARENT') return true;

  return false;
}

function pushInterval(
  intervals: BusyInterval[],
  start: DateTime,
  end: DateTime,
  summary: string | null | undefined,
  uid: string | null | undefined,
): void {
  if (!start.isValid || !end.isValid || end <= start) return;

  intervals.push({
    start,
    end,
    summary: summary ?? undefined,
    uid: uid ?? undefined,
  });
}

function expandRecurringEvent(
  event: Event,
  rangeStart: DateTime,
  rangeEnd: DateTime,
): BusyInterval[] {
  const intervals: BusyInterval[] = [];
  const iter = event.iterator();
  let count = 0;

  let occur: Time | null;
  while ((occur = iter.next()) && count < MAX_OCCURRENCES_PER_EVENT) {
    count++;
    const details = event.getOccurrenceDetails(occur);
    const start = icalTimeToDateTime(details.startDate);
    if (start > rangeEnd) break;

    const end = icalTimeToDateTime(details.endDate);
    if (end < rangeStart) continue;

    pushInterval(
      intervals,
      start,
      end,
      details.item.summary,
      details.item.uid,
    );
  }

  return intervals;
}

function singleEventInterval(event: Event): BusyInterval[] {
  const start = event.startDate;
  const end = event.endDate;
  if (!start || !end) return [];

  return [
    {
      start: icalTimeToDateTime(start),
      end: icalTimeToDateTime(end),
      summary: event.summary ?? undefined,
      uid: event.uid ?? undefined,
    },
  ];
}

export function parseIcs(icsText: string): ParsedCalendar {
  const jcal = ICAL.parse(icsText);
  const root = new ICAL.Component(jcal);

  const calName =
    getPropertyText(root, 'x-wr-calname') ??
    getPropertyText(root, 'name') ??
    'Calendar';

  const tzFromCal =
    getPropertyText(root, 'x-wr-timezone') ?? TIMEZONE;

  const now = DateTime.now().setZone(TIMEZONE);
  const rangeStart = now.minus(RANGE_PAST);
  const rangeEnd = now.plus(RANGE_FUTURE);

  const intervals: BusyInterval[] = [];
  const vevents = root.getAllSubcomponents('vevent');

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    if (shouldSkipEvent(event, vevent)) continue;

    if (event.isRecurring()) {
      intervals.push(...expandRecurringEvent(event, rangeStart, rangeEnd));
    } else {
      intervals.push(...singleEventInterval(event));
    }
  }

  return {
    name: calName,
    intervals,
    timezone: tzFromCal,
  };
}
