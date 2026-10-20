import type { ModelSettings } from './chat-model.js';

// The model the panel calls, kept in this browser only: the key is the person's, and the U-Board server never sees it.
const KEY = 'ub-assistant-model';

export function loadModelSettings(): ModelSettings | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ModelSettings> | null;
    if (!stored || typeof stored.baseUrl !== 'string' || typeof stored.model !== 'string') return null;
    return { baseUrl: stored.baseUrl, model: stored.model, apiKey: typeof stored.apiKey === 'string' ? stored.apiKey : '' };
  } catch {
    return null;
  }
}

export function saveModelSettings(settings: ModelSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // A browser that keeps nothing (a private window with storage off) asks again next time.
  }
}

export function clearModelSettings(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing kept, nothing to clear.
  }
}
