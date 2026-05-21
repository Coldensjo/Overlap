import type { CompareState, SingleState } from '../types.ts';
import type { SlotInfo } from '../compare/intervals.ts';

export const STATE_CLASS: Record<CompareState, string> = {
  bothFree: 'both-free',
  only1Busy: 'only1-busy',
  only2Busy: 'only2-busy',
  bothBusy: 'both-busy',
};

export const SINGLE_CLASS: Record<SingleState, string> = {
  free: 'single-free',
  busy: 'single-busy',
};

export function slotClass(slot: SlotInfo): string {
  if (slot.compare) return STATE_CLASS[slot.compare];
  return SINGLE_CLASS[slot.single ?? 'free'];
}

export function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '&#10;');
}

export function slotTitleAttr(slot: SlotInfo): string {
  if (!slot.tooltip) return '';
  return ` title="${escapeAttr(slot.tooltip)}"`;
}
