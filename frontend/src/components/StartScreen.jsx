import React from 'react';
import { DIFFICULTIES } from '../lib/sudoku';

const DESCRIPTIONS = {
  easy: '45 открытых цифр — чтобы освоить голосовые команды',
  medium: '35 открытых цифр — классическая партия',
  hard: '27 открытых цифр — придётся подумать',
};

export function StartScreen({ loading, onStart }) {
  return (
    <main className="start">
      <p className="start-lead">Скажите «лёгкая игра» или выберите уровень</p>
      <div className="levels">
        {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
          <button key={key} className="level" disabled={loading} onClick={() => onStart(key)}>
            <span className="level-name">{label}</span>
            <span className="level-desc">{DESCRIPTIONS[key]}</span>
          </button>
        ))}
      </div>
      {loading && <p className="start-loading">Готовлю поле…</p>}
    </main>
  );
}
