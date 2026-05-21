import type { DateTime } from 'luxon';

export interface BusyInterval {
  start: DateTime;
  end: DateTime;
  summary?: string;
  uid?: string;
}

export interface ParsedCalendar {
  name: string;
  intervals: BusyInterval[];
  timezone: string;
}

export type CompareState = 'bothFree' | 'only1Busy' | 'only2Busy' | 'bothBusy';

export type SingleState = 'free' | 'busy';

export type ViewMode = 'week' | 'month';

export const TIMEZONE = 'Europe/Stockholm';
export const SLOT_MINUTES = 15;
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
