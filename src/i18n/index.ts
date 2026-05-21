import { Settings } from 'luxon';
import {
  translations,
  type Lang,
  type TranslationKey,
} from './translations.ts';

const STORAGE_KEY = 'overlap-lang';

let currentLang: Lang = loadStoredLang();
const listeners = new Set<() => void>();

function loadStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sv') return stored;
  } catch {
    /* private browsing */
  }
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('sv') ? 'sv' : 'en';
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  Settings.defaultLocale = lang === 'sv' ? 'sv' : 'en';
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void): void {
  listeners.add(fn);
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = translations[currentLang][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function dayNames(): string[] {
  return [
    t('dayMon'),
    t('dayTue'),
    t('dayWed'),
    t('dayThu'),
    t('dayFri'),
    t('daySat'),
    t('daySun'),
  ];
}

export function applyI18n(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as TranslationKey;
    if (key) el.textContent = t(key);
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder as TranslationKey;
    if (key && el instanceof HTMLInputElement) el.placeholder = t(key);
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.dataset.i18nAria as TranslationKey;
    if (key) el.setAttribute('aria-label', t(key));
  });

  document.title = t('appTitle');
}

Settings.defaultLocale = currentLang === 'sv' ? 'sv' : 'en';
document.documentElement.lang = currentLang;
