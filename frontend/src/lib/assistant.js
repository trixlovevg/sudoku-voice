// =====================================================================
// Подключение к ассистенту Салют (как в todo-canvas-app).
// В режиме разработки (npm start) — createSmartappDebugger: в браузере
// появляется панель ассистента, а запросы идут в ваш смартап по токену.
// В собранном приложении на устройстве — createAssistant.
// =====================================================================
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

export function initializeAssistant(getState) {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
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
    });
  }
  // На устройстве/в эмуляторе Studio есть window.AssistantHost. В обычном браузере
  // его нет — тогда игра работает без голоса, а не падает.
  if (!window.AssistantHost) {
    console.warn('AssistantHost не найден: приложение открыто не на устройстве Салют, голос отключён.');
    return null;
  }
  return createAssistant({ getState });
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
