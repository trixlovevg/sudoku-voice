// =====================================================================
// Подключение к ассистенту Салют (как в todo-canvas-app).
// В режиме разработки (npm start) — createSmartappDebugger: в браузере
// появляется панель ассистента, а запросы идут в ваш смартап по токену.
// В собранном приложении на устройстве — createAssistant.
// =====================================================================
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

// onReady(assistant | null) вызывается, когда ясно, есть ли ассистент
export function initializeAssistant(getState, onReady) {
  if (process.env.NODE_ENV === 'development') {
    onReady(createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      // Эта фраза отправляется при запуске и должна совпасть с паттерном
      // состояния Start в scenario/src/entryPoint.sc («запусти судоку голосом»)
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: 'Скажите: строка 3 столбец 4 цифра 5',
        screenshotMode: false,
        tabIndex: -1,
      },
    }));
    return;
  }
  // На устройстве Салют страница получает объект window.AssistantHost.
  // На некоторых клиентах он появляется чуть позже загрузки страницы,
  // поэтому ждём его до 5 секунд. В обычном браузере его нет —
  // тогда игра работает без голоса, а не падает.
  const start = Date.now();
  const tryConnect = () => {
    if (window.AssistantHost) {
      try {
        onReady(createAssistant({ getState }));
      } catch (e) {
        console.warn('Не удалось подключить ассистента:', e);
        onReady(null);
      }
    } else if (Date.now() - start < 5000) {
      setTimeout(tryConnect, 100);
    } else {
      console.warn('AssistantHost не найден: приложение открыто не через Салют, голос отключён.');
      onReady(null);
    }
  };
  tryConnect();
}

// Отправка события в сценарий: action_id -> event!: <action_id> в .sc-файле
export function sendEvent(assistant, actionId, parameters = {}) {
  if (!assistant) return;
  try {
    const unsubscribe = assistant.sendData({ action: { action_id: actionId, parameters } }, (data) => {
      console.log('sendData ответ:', data);
      unsubscribe();
    });
  } catch (e) {
    console.warn('sendData не удалось:', e);
  }
}
