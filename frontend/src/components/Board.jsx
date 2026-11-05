import React, { useMemo } from 'react';
import { findConflicts } from '../lib/sudoku';

const N = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Поле 9×9 с номерами строк и столбцов — по ним игрок называет клетки голосом.
export function Board({ state, onSelect }) {
  const { board, fixed, selected, hinted, wrong, status } = state;
  const conflicts = useMemo(() => findConflicts(board), [board]);
  const selValue = selected ? board[selected.r * 9 + selected.c] : 0;

  return (
    <div className="board-wrap">
      <div className="axis axis-top" aria-hidden>
        {N.map((n) => <span key={n}>{n}</span>)}
      </div>
      <div className="axis axis-left" aria-hidden>
        {N.map((n) => <span key={n}>{n}</span>)}
      </div>
      <div className={`board ${status !== 'playing' ? 'board-done' : ''}`} role="grid" aria-label="Поле судоку">
        {board.map((v, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const isSel = selected && selected.r === r && selected.c === c;
          const related =
            selected &&
            !isSel &&
            (selected.r === r ||
              selected.c === c ||
              (Math.floor(selected.r / 3) === Math.floor(r / 3) && Math.floor(selected.c / 3) === Math.floor(c / 3)));
          const cls = [
            'cell',
            fixed[i] ? 'cell-fixed' : 'cell-user',
            hinted.includes(i) && 'cell-hinted',
            isSel && 'cell-selected',
            related && 'cell-related',
            v && selValue === v && !isSel && 'cell-same',
            conflicts.has(i) && 'cell-conflict',
            wrong.includes(i) && 'cell-wrong',
            c % 3 === 2 && c !== 8 && 'edge-r',
            r % 3 === 2 && r !== 8 && 'edge-b',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onSelect(r, c)}
              aria-label={`Строка ${r + 1}, столбец ${c + 1}${v ? `, ${v}` : ', пусто'}`}
              tabIndex={-1}
            >
              {v || ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
