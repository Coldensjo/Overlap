import { t } from '../i18n/index.ts';

export function renderLegend(
  container: HTMLElement,
  twoCalendars: boolean,
): void {
  if (twoCalendars) {
    container.innerHTML = `
      <h3>${t('legend')}</h3>
      <ul class="legend-items">
        <li><span class="swatch both-free"></span> ${t('bothFree')}</li>
        <li><span class="swatch only2-busy"></span> ${t('only2Busy')}</li>
        <li><span class="swatch only1-busy"></span> ${t('only1Busy')}</li>
        <li><span class="swatch both-busy"></span> ${t('bothBusy')}</li>
        <li><span class="swatch mutual-free-day-swatch"></span> ${t('mutualFreeDay')}</li>
      </ul>
    `;
  } else {
    container.innerHTML = `
      <h3>${t('legend')}</h3>
      <ul class="legend-items">
        <li><span class="swatch single-free"></span> ${t('singleFree')}</li>
        <li><span class="swatch single-busy"></span> ${t('singleBusy')}</li>
      </ul>
    `;
  }
}
