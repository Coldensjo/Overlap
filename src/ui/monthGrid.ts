import { DateTime } from 'luxon';
import {
  buildDaySlots,
  getMonthGridDays,
  isMutualFreeDay,
} from '../compare/intervals.ts';
import { dayNames, getLang } from '../i18n/index.ts';
import type { BusyInterval } from '../types.ts';
import { TIMEZONE } from '../types.ts';
import { slotClass, slotTitleAttr } from './slotDisplay.ts';

function formatMonthLabel(monthStart: DateTime): string {
  return `${monthStart.setLocale(getLang()).toFormat('MMMM yyyy')} (${TIMEZONE})`;
}

export function renderMonthGrid(
  container: HTMLElement,
  monthStart: DateTime,
  cal1: BusyInterval[] | null,
  cal2: BusyInterval[] | null,
  onLabel: (label: string) => void,
): void {
  const twoCal = cal1 !== null && cal2 !== null;
  const days = getMonthGridDays(monthStart);
  const targetMonth = monthStart.month;
  onLabel(formatMonthLabel(monthStart.startOf('month')));

  const names = dayNames();

  let html =
    '<div class="grid-wrapper month-wrapper"><table class="month-grid"><thead><tr>';

  for (const name of names) {
    html += `<th>${name}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let row = 0; row < days.length / 7; row++) {
    html += '<tr>';
    for (let col = 0; col < 7; col++) {
      const day = days[row * 7 + col];
      const inMonth = day.month === targetMonth;
      const isToday = day.hasSame(DateTime.now().setZone(TIMEZONE), 'day');
      const daySlots = buildDaySlots(day, cal1, cal2);
      const mutualFree = isMutualFreeDay(daySlots, twoCal);

      let mini = '';
      for (const slot of daySlots) {
        const cls = mutualFree ? 'both-free' : slotClass(slot);
        mini += `<div class="mini-slot ${cls}"${slotTitleAttr(slot)}></div>`;
      }

      const classes = [
        'month-day',
        inMonth ? 'in-month' : 'other-month',
        isToday ? 'today' : '',
        mutualFree ? 'mutual-free-day' : '',
      ]
        .filter(Boolean)
        .join(' ');

      html += `<td class="${classes}">
        <div class="day-num">${day.day}</div>
        <div class="day-mini">${mini}</div>
      </td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}
