import './styles.css';
import { DateTime } from 'luxon';
import {
  getMonthStart,
  getWeekStart,
  initialPeriodStart,
  mergeIntervals,
} from './compare/intervals.ts';
import { applyI18n, getLang, onLangChange, setLang, t } from './i18n/index.ts';
import { IcsLoadError, loadFromFile, loadFromUrl } from './ics/load.ts';
import { parseIcs } from './ics/parse.ts';
import type { ParsedCalendar, ViewMode } from './types.ts';
import { TIMEZONE } from './types.ts';
import { renderLegend } from './ui/legend.ts';
import { renderMonthGrid } from './ui/monthGrid.ts';
import { renderWeekGrid } from './ui/weekGrid.ts';

let calendar1: ParsedCalendar | null = null;
let calendar2: ParsedCalendar | null = null;
let viewMode: ViewMode = 'week';
let periodStart = getWeekStart(DateTime.now().setZone(TIMEZONE));

const viewMain = document.getElementById('view-main')!;
const viewHelp = document.getElementById('view-help')!;
const statusEl = document.getElementById('status')!;
const legendEl = document.getElementById('legend')!;
const gridContainer = document.getElementById('grid-container')!;
const periodLabelEl = document.getElementById('period-label')!;
const prevBtn = document.getElementById('prev-period')!;
const nextBtn = document.getElementById('next-period')!;
const todayBtn = document.getElementById('today-period')!;
const viewWeekBtn = document.getElementById('view-week')!;
const viewMonthBtn = document.getElementById('view-month')!;
const langEnBtn = document.getElementById('lang-en')!;
const langSvBtn = document.getElementById('lang-sv')!;
const navHelpBtn = document.getElementById('nav-help')!;
const navBackBtn = document.getElementById('nav-back')!;

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function updateLangButtons(): void {
  const lang = getLang();
  langEnBtn.classList.toggle('active', lang === 'en');
  langSvBtn.classList.toggle('active', lang === 'sv');
  langEnBtn.setAttribute('aria-pressed', String(lang === 'en'));
  langSvBtn.setAttribute('aria-pressed', String(lang === 'sv'));
}

function updateNavLabels(): void {
  const isWeek = viewMode === 'week';
  prevBtn.textContent = isWeek ? t('prevWeek') : t('prevMonth');
  nextBtn.textContent = isWeek ? t('nextWeek') : t('nextMonth');
  viewWeekBtn.classList.toggle('active', isWeek);
  viewMonthBtn.classList.toggle('active', !isWeek);
  viewWeekBtn.setAttribute('aria-pressed', String(isWeek));
  viewMonthBtn.setAttribute('aria-pressed', String(!isWeek));
}

function showPage(page: 'main' | 'help'): void {
  viewMain.hidden = page !== 'main';
  viewHelp.hidden = page !== 'help';
  navHelpBtn.hidden = page === 'help';
}

function renderGrid(): void {
  if (viewMode === 'week') {
    renderWeekGrid(
      gridContainer,
      periodStart,
      calendar1?.intervals ?? null,
      calendar2?.intervals ?? null,
      (l) => {
        periodLabelEl.textContent = l;
      },
    );
  } else {
    renderMonthGrid(
      gridContainer,
      periodStart,
      calendar1?.intervals ?? null,
      calendar2?.intervals ?? null,
      (l) => {
        periodLabelEl.textContent = l;
      },
    );
  }
}

function refreshView(): void {
  updateNavLabels();
  const loaded = [calendar1, calendar2].filter(Boolean) as ParsedCalendar[];

  if (loaded.length === 0) {
    gridContainer.innerHTML = `<p class="empty-hint">${t('emptyHint')}</p>`;
    periodLabelEl.textContent = '';
    legendEl.innerHTML = '';
    setStatus(t('noCalendar'));
    return;
  }

  const twoCal = calendar1 !== null && calendar2 !== null;
  renderLegend(legendEl, twoCal);

  const counts = loaded.map((c) => {
    const merged = mergeIntervals(c.intervals);
    return `${c.name}: ${merged.length} ${t('busyBlocks')}`;
  });
  setStatus(counts.join(' · '));

  renderGrid();
}

function setViewMode(mode: ViewMode): void {
  if (mode === viewMode) return;

  if (mode === 'month') {
    periodStart = getMonthStart(periodStart);
  } else {
    periodStart = getWeekStart(periodStart);
  }

  viewMode = mode;
  refreshView();
}

function goToToday(): void {
  const loaded = [calendar1, calendar2].filter(Boolean) as ParsedCalendar[];
  periodStart =
    loaded.length > 0
      ? initialPeriodStart(loaded, viewMode)
      : viewMode === 'month'
        ? getMonthStart(DateTime.now().setZone(TIMEZONE))
        : getWeekStart(DateTime.now().setZone(TIMEZONE));
  refreshView();
}

async function loadCalendar(
  calNum: 1 | 2,
  urlInput: HTMLInputElement,
  fileInput: HTMLInputElement,
): Promise<void> {
  const url = urlInput.value.trim();
  const file = fileInput.files?.[0];

  if (!url && !file) {
    setStatus(t('needUrlOrFile', { n: calNum }), true);
    return;
  }

  try {
    setStatus(t('loadingCal', { n: calNum }));
    const text = file ? await loadFromFile(file) : await loadFromUrl(url);
    const parsed = parseIcs(text);

    if (calNum === 1) calendar1 = parsed;
    else calendar2 = parsed;

    const loaded = [calendar1, calendar2].filter(Boolean) as ParsedCalendar[];
    periodStart = initialPeriodStart(loaded, viewMode);
    refreshView();
  } catch (err) {
    const msg =
      err instanceof IcsLoadError
        ? err.hint
          ? `${err.message} ${err.hint}`
          : err.message
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    setStatus(t('calendarError', { n: calNum, msg }), true);
  }
}

function wireCalendarInput(calNum: 1 | 2): void {
  const section = document.querySelector(`.cal-input[data-cal="${calNum}"]`)!;
  const urlInput = section.querySelector('.url-input') as HTMLInputElement;
  const fileInput = section.querySelector('.file-input') as HTMLInputElement;
  const loadBtn = section.querySelector('.load-btn') as HTMLButtonElement;

  loadBtn.addEventListener('click', () => loadCalendar(calNum, urlInput, fileInput));
}

function onLanguageChange(): void {
  applyI18n();
  updateLangButtons();
  refreshView();
}

prevBtn.addEventListener('click', () => {
  periodStart =
    viewMode === 'week'
      ? periodStart.minus({ weeks: 1 })
      : periodStart.minus({ months: 1 });
  refreshView();
});

nextBtn.addEventListener('click', () => {
  periodStart =
    viewMode === 'week'
      ? periodStart.plus({ weeks: 1 })
      : periodStart.plus({ months: 1 });
  refreshView();
});

todayBtn.addEventListener('click', goToToday);
viewWeekBtn.addEventListener('click', () => setViewMode('week'));
viewMonthBtn.addEventListener('click', () => setViewMode('month'));
langEnBtn.addEventListener('click', () => setLang('en'));
langSvBtn.addEventListener('click', () => setLang('sv'));
navHelpBtn.addEventListener('click', () => showPage('help'));
navBackBtn.addEventListener('click', () => showPage('main'));

onLangChange(onLanguageChange);

wireCalendarInput(1);
wireCalendarInput(2);
applyI18n();
updateLangButtons();
refreshView();
