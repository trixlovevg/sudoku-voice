import React from 'react';

// Цифровая панель + подсказки голосовых команд.
// Под каждой цифрой — сколько её ещё осталось поставить.
export function NumberPad({ board, disabled, onDigit, onErase, onSolve, solved, onNewGame }) {
  const left = (d) => 9 - board.filter((v) => v === d).length;

  return (
    <aside className="side">
      <div className="pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          // Не атрибут disabled, а aria-disabled: кнопка остаётся доступной для фокуса с пульта,
          // просто ничего не делает (например, когда выбрана клетка с исходной цифрой)
          <button
            key={d}
            className={`pad-btn ${disabled || left(d) <= 0 ? 'is-off' : ''}`}
            aria-disabled={disabled || left(d) <= 0}
            onClick={() => !(disabled || left(d) <= 0) && onDigit(d)}
          >
            <span className="pad-digit">{d}</span>
            <span className="pad-left">{Math.max(0, left(d))}</span>
          </button>
        ))}
        <button
          className={`pad-btn pad-erase ${disabled ? 'is-off' : ''}`}
          aria-disabled={disabled}
          onClick={() => !disabled && onErase()}
        >
          Стереть
        </button>
      </div>

      <div className="voice-tips">
        <h3>Говорите</h3>
        <ul>
          <li>«строка 3 столбец 4 цифра 5»</li>
          <li>«поставь семёрку в 1 9»</li>
          <li>«выбери клетку 2 6» → «пять»</li>
          <li>«сотри», «отмени», «вправо»</li>
          <li>«подсказка», «проверь»</li>
          <li>«новая сложная игра»</li>
        </ul>
      </div>

      {solved ? (
        <button className="btn btn-primary wide" onClick={onNewGame}>Новая игра</button>
      ) : (
        <button className="btn btn-ghost wide" onClick={onSolve}>Сдаюсь, покажи решение</button>
      )}
    </aside>
  );
}
