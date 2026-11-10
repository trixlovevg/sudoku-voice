import React, { useEffect, useState } from 'react';
import { DIFFICULTIES } from '../lib/sudoku';

export function formatClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Timer({ startedAt, finishedAt, running }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  if (!startedAt) return <span className="stat-value">0:00</span>;
  const end = running ? now : finishedAt || now;
  return <span className="stat-value">{formatClock(Math.max(0, Math.floor((end - startedAt) / 1000)))}</span>;
}

// Показывает, подключён ли ассистент Салют (помогает при отладке на устройстве)
function VoiceBadge({ status }) {
  const text = { connecting: 'подключаю Салют…', on: 'голос: Салют подключён', off: 'голос недоступен: откройте через Салют' }[status];
  return <span className={`voice-badge voice-${status}`}>{text}</span>;
}

// После ввода имени экранная клавиатура закрывается, но некоторые встроенные
// браузеры оставляют страницу увеличенной или сдвинутой. Возвращаем исходный вид.
function resetViewport() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    const content = meta.getAttribute('content');
    meta.setAttribute('content', content + ', minimum-scale=1');
    setTimeout(() => meta.setAttribute('content', content), 100);
  }
  setTimeout(() => window.scrollTo(0, 0), 50);
}

export function TopBar({ state, voiceStatus, playerName, onNameChange, onNew, onHint, onCheck, onUndo, onLeaders, onHelp }) {
  const playing = state.status === 'playing';
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>9</span>
        <div>
          <h1>Судоку голосом</h1>
          <input
            className="player"
            value={playerName}
            maxLength={24}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter, Esc и «Назад» на пульте завершают ввод имени
              if (['Enter', 'Escape', 'Backspace'].includes(e.key) && (e.key !== 'Backspace' || !playerName)) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            onBlur={resetViewport}
            aria-label="Имя игрока"
          />
          <VoiceBadge status={voiceStatus} />
        </div>
      </div>

      {state.status !== 'idle' && (
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Уровень</span>
            <span className="stat-value">{DIFFICULTIES[state.difficulty]?.label}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Время</span>
            <Timer startedAt={state.startedAt} finishedAt={state.finishedAt} running={playing} />
          </div>
          <div className="stat">
            <span className="stat-label">Подсказки</span>
            <span className="stat-value">{state.hints}</span>
          </div>
        </div>
      )}

      <nav className="actions">
        <button className="btn" onClick={onNew}>Новая</button>
        <button className="btn" onClick={onHint} disabled={!playing}>Подсказка</button>
        <button className="btn" onClick={onCheck} disabled={!playing}>Проверить</button>
        <button className="btn" onClick={onUndo} disabled={!playing || !state.history.length}>Отменить</button>
        <button className="btn btn-ghost" onClick={onLeaders}>Рекорды</button>
        <button className="btn btn-ghost" onClick={onHelp}>Правила</button>
      </nav>
    </header>
  );
}
