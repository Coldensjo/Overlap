import { DateTime } from 'luxon';
import { buildDaySlots, buildWeekSlots, isMutualFreeDay } from '../compare/intervals.ts';
import { dayNames, getLang } from '../i18n/index.ts';
import type { BusyInterval } from '../types.ts';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
  TIMEZONE,
} from '../types.ts';
import { slotClass, slotTitleAttr } from './slotDisplay.ts';

function formatWeekLabel(weekStart: DateTime): string {
  const weekEnd = weekStart.plus({ days: 6 });
  const fmt = (d: DateTime) =>
    d.setLocale(getLang()).toFormat('d MMM yyyy');
  return `${fmt(weekStart)} – ${fmt(weekEnd)} (${TIMEZONE})`;
}

export function renderWeekGrid(
  container: HTMLElement,
  weekStart: DateTime,
  cal1: BusyInterval[] | null,
  cal2: BusyInterval[] | null,
  onLabel: (label: string) => void,
): void {
  const twoCal = cal1 !== null && cal2 !== null;
  const slots = buildWeekSlots(weekStart, cal1, cal2);
  const mutualFreeDays: boolean[] = [];

  for (let d = 0; d < 7; d++) {
    const daySlots = buildDaySlots(weekStart.plus({ days: d }), cal1, cal2);
    mutualFreeDays.push(isMutualFreeDay(daySlots, twoCal));
  }

  onLabel(formatWeekLabel(weekStart));

  const names = dayNames();
  const hours: number[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h);

  const slotsPerHour = 60 / SLOT_MINUTES;

  let html = '<div class="grid-wrapper"><table class="week-grid"><thead><tr><th class="time-col"></th>';

  for (let d = 0; d < 7; d++) {
    const dayDate = weekStart.plus({ days: d });
    const thClass = mutualFreeDays[d] ? ' class="mutual-free-day-header"' : '';
    html += `<th${thClass}><span class="day-name">${names[d]}</span><span class="day-date">${dayDate.toFormat('d/M')}</span></th>`;
  }
  html += '</tr></thead><tbody>';

  for (let hi = 0; hi < hours.length; hi++) {
    const hour = hours[hi];
    html += '<tr>';
    html += `<td class="time-col" rowspan="${slotsPerHour}">${String(hour).padStart(2, '0')}:00</td>`;

    for (let si = 0; si < slotsPerHour; si++) {
      if (si > 0) html += '<tr>';

      for (let d = 0; d < 7; d++) {
        const slot = slots[d][hi][si];
        const dayClass = mutualFreeDays[d] ? ' mutual-free-day' : '';
        const slotCls = mutualFreeDays[d] ? 'both-free' : slotClass(slot);
        html += `<td class="slot ${slotCls}${dayClass}"${slotTitleAttr(slot)}></td>`;
      }

      html += '</tr>';
    }
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}
