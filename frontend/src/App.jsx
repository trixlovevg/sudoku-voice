import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import './App.css';
import { reducer, initialState } from './lib/gameReducer';
import { fetchPuzzle, postScore, wakeUpServer } from './lib/api';
import { findNext, focusFirst } from './lib/spatialNav';
import { initializeAssistant, sendEvent } from './lib/assistant';
import { DIFFICULTIES, toString81 } from './lib/sudoku';
import { Board } from './components/Board';
import { NumberPad } from './components/NumberPad';
import { TopBar } from './components/TopBar';
import { StartScreen } from './components/StartScreen';
import { Overlay } from './components/Overlay';

const idx = (r, c) => r * 9 + c;
const inRange = (n) => Number.isInteger(n) && n >= 1 && n <= 9;

function loadName() {
  try {
    return localStorage.getItem('sudoku-player') || 'Игрок';
  } catch {
    return 'Игрок';
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [playerName, setPlayerName] = useState(loadName);
  const [lastRank, setLastRank] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('connecting'); // connecting | on | off

  // Ассистент живёт всё время работы приложения, а свежее состояние
  // ему отдаём через ref (обработчики создаются один раз).
  const stateRef = useRef(state);
  stateRef.current = state;
  const assistantRef = useRef(null);
  const initStartedRef = useRef(false);
  const nameRef = useRef(playerName);
  nameRef.current = playerName;

  // ---------------- действия игры (общие для голоса, мыши и клавиатуры) ----------------
  const startNewGame = useCallback(async (difficulty = 'medium') => {
    const d = DIFFICULTIES[difficulty] ? difficulty : 'medium';
    dispatch({ type: 'LOADING', difficulty: d });
    const { puzzle, solution } = await fetchPuzzle(d);
    dispatch({ type: 'NEW_GAME', difficulty: d, puzzle, solution });
    setLastRank(null);
  }, []);

  const giveHint = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing') return;
    // Сначала — выбранная клетка, если она пустая или неверная; иначе первая такая
    const candidates = [];
    if (s.selected) candidates.push(idx(s.selected.r, s.selected.c));
    for (let i = 0; i < 81; i++) candidates.push(i);
    const i = candidates.find((k) => !s.fixed[k] && s.board[k] !== s.solution[k]);
    if (i === undefined) {
      sendEvent(assistantRef.current, 'hint_result', {});
      return;
    }
    dispatch({ type: 'HINT', i });
    sendEvent(assistantRef.current, 'hint_result', {
      row: Math.floor(i / 9) + 1,
      col: (i % 9) + 1,
      value: s.solution[i],
    });
  }, []);

  const checkBoard = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing') return;
    const wrong = [];
    let empty = 0;
    s.board.forEach((v, i) => {
      if (!v) empty++;
      else if (v !== s.solution[i]) wrong.push(i);
    });
    dispatch({ type: 'MARK_WRONG', wrong });
    sendEvent(assistantRef.current, 'check_result', { errors: wrong.length, empty });
  }, []);

  // ---------------- обработка команд от голосового сценария ----------------
  const handleAssistantAction = useCallback(
    (action) => {
      console.log('Команда от сценария:', action);
      if (!action) return;
      const s = stateRef.current;
      const sel = s.selected;
      // row/col приходят 1..9; если не пришли — берём выбранную клетку
      const r = inRange(action.row) ? action.row - 1 : sel?.r;
      const c = inRange(action.col) ? action.col - 1 : sel?.c;
      const hasCell = r !== undefined && c !== undefined;

      switch (action.type) {
        case 'new_game':
          return startNewGame(action.difficulty);
        case 'set_value':
          if (hasCell && inRange(action.value)) dispatch({ type: 'SET', i: idx(r, c), v: action.value });
          return;
        case 'erase':
          if (hasCell) dispatch({ type: 'ERASE', i: idx(r, c) });
          return;
        case 'select':
          if (hasCell) dispatch({ type: 'SELECT', r, c });
          return;
        case 'move':
          return dispatch({ type: 'MOVE', direction: action.direction });
        case 'hint':
          return giveHint();
        case 'check':
          return checkBoard();
        case 'undo':
          return dispatch({ type: 'UNDO' });
        case 'solve':
          return dispatch({ type: 'SOLVE' });
        case 'show_leaders':
          return dispatch({ type: 'OVERLAY', overlay: 'leaders' });
        case 'show_help':
          return dispatch({ type: 'OVERLAY', overlay: 'help' });
        case 'close_overlay':
          return dispatch({ type: 'OVERLAY', overlay: null });
        default:
          console.warn('Неизвестная команда:', action.type);
      }
    },
    [startNewGame, giveHint, checkBoard]
  );

  // Ссылка на актуальный обработчик (подписка на ассистента — один раз)
  const actionRef = useRef(handleAssistantAction);
  actionRef.current = handleAssistantAction;

  useEffect(() => {
    wakeUpServer();
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    // То, что увидит сценарий в payload.meta.current_app.state
    const getState = () => {
      const s = stateRef.current;
      return {
        screen: 'game',
        status: s.status,
        difficulty: s.difficulty,
        board: s.board.length ? toString81(s.board) : '',
        fixed: s.fixed.length ? s.fixed.map((f) => (f ? '1' : '0')).join('') : '',
        selected: s.selected ? { row: s.selected.r + 1, col: s.selected.c + 1 } : null,
      };
    };

    initializeAssistant(getState, (assistant) => {
      assistantRef.current = assistant;
      setVoiceStatus(assistant ? 'on' : 'off');
      if (!assistant) return; // открыто вне Салюта — играем мышью/клавиатурой

      assistant.on('data', (event) => {
        if (event.type === 'character') return;
        if (event.type === 'insets') {
          const bottom = event.insets?.bottom ?? 0;
          document.documentElement.style.setProperty('--inset-bottom', `${bottom}px`);
          return;
        }
        if (event.action) actionRef.current(event.action);
      });
      assistant.on('start', () => console.log('Ассистент запущен', assistant.getInitialData?.()));
      assistant.on('error', (e) => console.warn('Ошибка ассистента', e));
    });
  }, []);

  // ---------------- победа: сохраняем результат и сообщаем сценарию ----------------
  useEffect(() => {
    if (state.status !== 'won') return;
    const seconds = Math.round((state.finishedAt - state.startedAt) / 1000);
    const result = { name: nameRef.current, difficulty: state.difficulty, seconds, hints: state.hints };
    postScore(result).then((res) => {
      const rank = res?.rank ?? null;
      setLastRank(rank);
      sendEvent(assistantRef.current, 'game_won', { seconds, hints: state.hints, rank });
    });
  }, [state.status, state.finishedAt, state.startedAt, state.difficulty, state.hints]);

  // ---------------- клавиатура и пульт ТВ ----------------
  // ---------------- куда ставить фокус (важно для пульта ТВ) ----------------
  // Новая игра → фокус на поле
  useEffect(() => {
    if (state.status === 'playing') document.querySelector('.board')?.focus();
  }, [state.startedAt, state.status]);

  // Открылось окно → фокус на его кнопки; закрылось → обратно на поле или на кнопки экрана
  const overlayWasOpen = useRef(false);
  useEffect(() => {
    if (state.overlay) {
      overlayWasOpen.current = true;
      const t = setTimeout(() => {
        const dialog = document.querySelector('.dialog');
        if (dialog) focusFirst(dialog);
      }, 0);
      return () => clearTimeout(t);
    }
    if (!overlayWasOpen.current) return;
    overlayWasOpen.current = false;
    const board = document.querySelector('.board:not(.board-done)');
    if (stateRef.current.status === 'playing' && board) board.focus();
    else focusFirst(document.querySelector('main') || document);
  }, [state.overlay]);

  // Фокус «на поле» = фокус на элементе .board; стрелки двигают выделенную клетку,
  // а у края поля переводят фокус на ближайшую кнопку (spatialNav.js).
  // Фокус «на кнопке» — стрелки ходят между кнопками, OK/Enter нажимает кнопку.
  useEffect(() => {
    const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const EDGE = { up: (r) => r === 0, down: (r) => r === 8, left: (r, c) => c === 0, right: (r, c) => c === 8 };

    const focusEl = (el) => {
      if (!el) return;
      if (el.classList.contains('board') && !stateRef.current.selected) {
        dispatch({ type: 'SELECT', r: 0, c: 0 });
      }
      el.focus();
    };

    const onKey = (e) => {
      const s = stateRef.current;
      const dir = DIRS[e.key];
      const active = document.activeElement;
      const dialog = document.querySelector('.dialog');

      // 1. Открыто окно (правила, рекорды, победа): навигация только внутри него
      if (dialog) {
        if (e.key === 'Escape' || (e.key === 'Backspace' && active?.tagName !== 'INPUT')) {
          e.preventDefault();
          dispatch({ type: 'OVERLAY', overlay: null });
          return;
        }
        if (dir) {
          e.preventDefault();
          if (!dialog.contains(active)) focusFirst(dialog);
          else focusEl(findNext(active.getBoundingClientRect(), dir, dialog, active));
        }
        return;
      }

      const inBoard = !!active?.closest?.('.board');
      const onBody = !active || active === document.body;

      // 2. Поле ввода имени: влево/вправо двигают курсор в тексте, вверх/вниз — уходят из поля
      if (active?.tagName === 'INPUT') {
        if (dir === 'up' || dir === 'down') {
          e.preventDefault();
          focusEl(findNext(active.getBoundingClientRect(), dir, document, active));
        }
        return;
      }

      // 3. Фокус на кнопке: переходим к соседнему элементу
      if (dir && !onBody && (!inBoard || s.status !== 'playing')) {
        e.preventDefault();
        focusEl(findNext(active.getBoundingClientRect(), dir, document, active));
        return;
      }

      // 4. Фокуса нет (например, после запуска): первая стрелка ставит его на поле или на первую кнопку
      if (dir && onBody) {
        e.preventDefault();
        const board = document.querySelector('.board');
        if (s.status === 'playing' && board) focusEl(board);
        else focusFirst(document.querySelector('main') || document);
        return;
      }

      // 5. Фокус на поле (или ни на чём): управление клетками
      if (s.status !== 'playing' || !s.selected) return;
      const i = idx(s.selected.r, s.selected.c);
      if (dir) {
        e.preventDefault();
        const { r, c } = s.selected;
        if (EDGE[dir](r, c)) {
          // Край поля: уходим на ближайшую кнопку в этом направлении (если она есть)
          const cell = document.querySelectorAll('.board .cell')[i];
          const board = document.querySelector('.board');
          if (cell) focusEl(findNext(cell.getBoundingClientRect(), dir, document, board));
        } else {
          dispatch({ type: 'MOVE', direction: dir });
        }
      } else if (/^[1-9]$/.test(e.key)) {
        dispatch({ type: 'SET', i, v: Number(e.key) });
      } else if (['0', 'Backspace', 'Delete'].includes(e.key)) {
        dispatch({ type: 'ERASE', i });
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const changeName = (name) => {
    setPlayerName(name);
    try {
      localStorage.setItem('sudoku-player', name);
    } catch {
      /* хранилище недоступно — имя просто не запомнится */
    }
  };

  const selectedIndex = state.selected ? idx(state.selected.r, state.selected.c) : -1;
  const inGame = ['playing', 'won', 'solved'].includes(state.status);

  return (
    <div className="app">
      <TopBar
        state={state}
        voiceStatus={voiceStatus}
        playerName={playerName}
        onNameChange={changeName}
        onNew={() => startNewGame(state.difficulty)}
        onHint={giveHint}
        onCheck={checkBoard}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onLeaders={() => dispatch({ type: 'OVERLAY', overlay: 'leaders' })}
        onHelp={() => dispatch({ type: 'OVERLAY', overlay: 'help' })}
      />

      {!inGame ? (
        <StartScreen loading={state.status === 'loading'} onStart={startNewGame} />
      ) : (
        <main className="game">
          <Board state={state} onSelect={(r, c) => dispatch({ type: 'SELECT', r, c })} />
          <NumberPad
            board={state.board}
            disabled={state.status !== 'playing' || selectedIndex < 0 || state.fixed[selectedIndex]}
            onDigit={(v) => dispatch({ type: 'SET', i: selectedIndex, v })}
            onErase={() => dispatch({ type: 'ERASE', i: selectedIndex })}
            onSolve={() => dispatch({ type: 'SOLVE' })}
            solved={state.status !== 'playing'}
            onNewGame={() => startNewGame(state.difficulty)}
          />
        </main>
      )}

      <Overlay
        kind={state.overlay}
        state={state}
        rank={lastRank}
        onClose={() => dispatch({ type: 'OVERLAY', overlay: null })}
        onNewGame={startNewGame}
      />
    </div>
  );
}
