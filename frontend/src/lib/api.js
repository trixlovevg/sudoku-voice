// =====================================================================
// Обращения к backend (Node.js). Адрес задаётся REACT_APP_API_URL;
// если он пустой — запросы идут на тот же сайт (в dev их проксирует
// "proxy" из package.json на http://localhost:3001).
// Если сервер недоступен, головоломка генерируется прямо в браузере.
// =====================================================================
import { generate, fromString81 } from './sudoku';

const API = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API + path, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPuzzle(difficulty) {
  try {
    const data = await request(`/api/puzzle?difficulty=${difficulty}`);
    return { puzzle: fromString81(data.puzzle), solution: fromString81(data.solution), source: 'server' };
  } catch (e) {
    console.warn('Сервер недоступен, генерирую головоломку локально:', e.message);
    const { puzzle, solution } = generate(difficulty);
    return { puzzle, solution, source: 'local' };
  }
}

// Бесплатные хостинги (например, Render) «усыпляют» сервер без запросов,
// а просыпается он до минуты. Будим его сразу при открытии приложения,
// пока игрок выбирает уровень. Ошибки здесь не важны.
export function wakeUpServer() {
  request('/api/health', {}, 60000).catch(() => {});
}

export async function fetchScores(difficulty) {
  try {
    return await request(`/api/scores${difficulty ? `?difficulty=${difficulty}` : ''}`, {}, 20000);
  } catch {
    return null; // null = сервер недоступен
  }
}

export async function postScore(result) {
  try {
    return await request('/api/scores', { method: 'POST', body: JSON.stringify(result) }, 20000);
  } catch {
    return null;
  }
}
