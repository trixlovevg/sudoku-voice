import React, { useEffect, useState } from 'react';
import { fetchScores } from '../lib/api';
import { DIFFICULTIES } from '../lib/sudoku';
import { formatClock } from './TopBar';

function Leaders({ initial }) {
  const [difficulty, setDifficulty] = useState(initial || 'medium');
  const [scores, setScores] = useState(undefined);

  useEffect(() => {
    setScores(undefined);
    fetchScores(difficulty).then(setScores);
  }, [difficulty]);

  return (
    <>
      <h2>Таблица рекордов</h2>
      <div className="tabs">
        {Object.entries(DIFFICULTIES).map(([k, { label }]) => (
          <button key={k} className={`tab ${k === difficulty ? 'tab-active' : ''}`} onClick={() => setDifficulty(k)}>
            {label}
          </button>
        ))}
      </div>
      {scores === undefined && <p className="muted">Загружаю…</p>}
      {scores === null && <p className="muted">Сервер рекордов недоступен. Запустите backend (npm start в папке backend).</p>}
      {scores && scores.length === 0 && <p className="muted">Пока никто не решил судоку этого уровня. Будьте первым!</p>}
      {scores && scores.length > 0 && (
        <table className="scores">
          <thead>
            <tr><th>#</th><th>Игрок</th><th>Время</th><th>Подсказки</th><th>Очки</th></tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={s.date + i}>
                <td>{i + 1}</td><td>{s.name}</td><td>{formatClock(s.seconds)}</td><td>{s.hints}</td><td>{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function Help() {
  return (
    <>
      <h2>Как играть</h2>
      <p>
        Заполните поле так, чтобы в каждой <b>строке</b>, каждом <b>столбце</b> и каждом квадрате 3×3 цифры от 1 до 9
        не повторялись. Строки нумеруются сверху вниз, столбцы — слева направо.
      </p>
      <table className="commands">
        <tbody>
          <tr><td>«строка 3 столбец 4 цифра 5»</td><td>поставить цифру</td></tr>
          <tr><td>«поставь 5 в 3 4», «3 4 5»</td><td>то же, коротко</td></tr>
          <tr><td>«выбери клетку 2 6», потом «семь»</td><td>выбрать клетку и вписать</td></tr>
          <tr><td>«вверх», «вниз», «влево», «вправо»</td><td>сдвинуть выбор</td></tr>
          <tr><td>«сотри», «сотри строку 2 столбец 5»</td><td>очистить клетку</td></tr>
          <tr><td>«отмени»</td><td>отменить ход</td></tr>
          <tr><td>«подсказка», «проверь»</td><td>помощь и проверка</td></tr>
          <tr><td>«новая лёгкая / средняя / сложная игра»</td><td>новая партия</td></tr>
          <tr><td>«рекорды», «закрой», «сдаюсь»</td><td>прочее</td></tr>
        </tbody>
      </table>
      <p className="muted">Клавиатура и пульт: стрелки, цифры 1–9, Backspace — стереть, Ctrl+Z — отмена.</p>
    </>
  );
}

function Win({ state, rank, onNewGame }) {
  const seconds = Math.round((state.finishedAt - state.startedAt) / 1000);
  return (
    <>
      <h2>Судоку решено!</h2>
      <div className="win-stats">
        <div><span className="stat-label">Время</span><span className="win-value">{formatClock(seconds)}</span></div>
        <div><span className="stat-label">Подсказки</span><span className="win-value">{state.hints}</span></div>
        <div><span className="stat-label">Место</span><span className="win-value">{rank ?? '—'}</span></div>
      </div>
      <div className="win-actions">
        {Object.entries(DIFFICULTIES).map(([k, { label }]) => (
          <button key={k} className={`btn ${k === state.difficulty ? 'btn-primary' : ''}`} onClick={() => onNewGame(k)}>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

export function Overlay({ kind, state, rank, onClose, onNewGame }) {
  if (!kind) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="dialog-close" onClick={onClose} aria-label="Закрыть">×</button>
        {kind === 'leaders' && <Leaders initial={state.difficulty} />}
        {kind === 'help' && <Help />}
        {kind === 'win' && <Win state={state} rank={rank} onNewGame={onNewGame} />}
      </div>
    </div>
  );
}
