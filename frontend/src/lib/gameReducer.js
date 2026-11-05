// =====================================================================
// Состояние игры и все изменения поля (чистый reducer — без побочных эффектов).
// Индексы клеток здесь 0..80, а строки/столбцы 0..8.
// Голосовой сценарий говорит «по-человечески» 1..9 — перевод делает App.jsx.
// =====================================================================
import { isSolved } from './sudoku';

export const initialState = {
  status: 'idle', // idle | loading | playing | won | solved
  difficulty: 'medium',
  puzzle: [],
  solution: [],
  board: [],
  fixed: [],
  selected: null, // { r, c }
  history: [], // [{ i, prev }]
  hints: 0,
  hinted: [], // индексы клеток, открытых подсказкой
  wrong: [], // индексы клеток, подсвеченных проверкой
  startedAt: 0,
  finishedAt: 0,
  overlay: null, // null | 'help' | 'leaders' | 'win'
};

function place(state, i, v) {
  if (state.status !== 'playing' || state.fixed[i] || state.board[i] === v) return state;
  const board = state.board.slice();
  const prev = board[i];
  board[i] = v;
  const next = {
    ...state,
    board,
    history: [...state.history, { i, prev }],
    wrong: state.wrong.filter((w) => w !== i),
    selected: { r: Math.floor(i / 9), c: i % 9 },
  };
  if (v && isSolved(board, state.solution)) {
    return { ...next, status: 'won', finishedAt: Date.now(), overlay: 'win', selected: null };
  }
  return next;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', difficulty: action.difficulty, overlay: null };

    case 'NEW_GAME':
      return {
        ...initialState,
        status: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        solution: action.solution,
        board: action.puzzle.slice(),
        fixed: action.puzzle.map((v) => v !== 0),
        selected: { r: 0, c: 0 },
        startedAt: Date.now(),
      };

    case 'SELECT':
      if (state.status !== 'playing') return state;
      return { ...state, selected: { r: action.r, c: action.c } };

    case 'MOVE': {
      if (state.status !== 'playing') return state;
      const { r, c } = state.selected || { r: 0, c: 0 };
      const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[action.direction];
      if (!d) return state;
      return { ...state, selected: { r: (r + d[0] + 9) % 9, c: (c + d[1] + 9) % 9 } };
    }

    case 'SET':
      return place(state, action.i, action.v);

    case 'ERASE':
      return place(state, action.i, 0);

    case 'UNDO': {
      if (state.status !== 'playing' || !state.history.length) return state;
      const last = state.history[state.history.length - 1];
      const board = state.board.slice();
      board[last.i] = last.prev;
      return {
        ...state,
        board,
        history: state.history.slice(0, -1),
        selected: { r: Math.floor(last.i / 9), c: last.i % 9 },
      };
    }

    case 'HINT': {
      const next = place(state, action.i, state.solution[action.i]);
      return { ...next, hints: state.hints + 1, hinted: [...state.hinted, action.i] };
    }

    case 'MARK_WRONG':
      return { ...state, wrong: action.wrong };

    case 'SOLVE':
      if (state.status !== 'playing') return state;
      return { ...state, board: state.solution.slice(), status: 'solved', finishedAt: Date.now(), selected: null, wrong: [] };

    case 'OVERLAY':
      return { ...state, overlay: action.overlay };

    default:
      return state;
  }
}
