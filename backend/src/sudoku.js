// =====================================================================
// Ядро судоку: генерация, решение, проверка.
// Копия frontend/src/lib/sudoku.js в формате CommonJS (для Node.js).
// Поле хранится как массив из 81 числа (0 — пустая клетка),
// индекс клетки = row * 9 + col, row и col от 0 до 8.
// =====================================================================

const DIFFICULTIES = {
  easy: { label: 'Лёгкий', holes: 36 },
  medium: { label: 'Средний', holes: 46 },
  hard: { label: 'Сложный', holes: 54 },
};

const ALL = 0x3fe; // биты 1..9

const idx = (r, c) => r * 9 + c;
const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bitCount(x) {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

// Подсчёт решений (до limit) поиском с возвратом.
// Используем битовые маски и эвристику «клетка с наименьшим числом кандидатов» (MRV).
function countSolutions(grid, limit = 2, out = null) {
  const g = grid.slice();
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (!v) continue;
    const r = Math.floor(i / 9), c = i % 9, b = boxOf(r, c), bit = 1 << v;
    if ((rows[r] | cols[c] | boxes[b]) & bit) return 0; // исходное поле противоречиво
    rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
  }
  let count = 0;

  function search() {
    let best = -1, bestMask = 0, bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const r = Math.floor(i / 9), c = i % 9;
      const mask = ALL & ~(rows[r] | cols[c] | boxes[boxOf(r, c)]);
      const n = bitCount(mask);
      if (n < bestCount) {
        best = i; bestMask = mask; bestCount = n;
        if (n <= 1) break;
      }
    }
    if (best === -1) {
      count++;
      if (out && count === 1) out.push(...g);
      return count >= limit;
    }
    if (bestCount === 0) return false;
    const r = Math.floor(best / 9), c = best % 9, b = boxOf(r, c);
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      g[best] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      if (search()) return true;
      g[best] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
    }
    return false;
  }

  search();
  return count;
}

function solve(grid) {
  const out = [];
  return countSolutions(grid, 1, out) ? out : null;
}

// Полностью заполненное случайное поле (backtracking со случайным порядком цифр)
function randomFullGrid(rnd) {
  const g = new Array(81).fill(0);
  function fill(pos) {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9), c = pos % 9;
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) {
      if (canPlace(g, r, c, v)) {
        g[pos] = v;
        if (fill(pos + 1)) return true;
        g[pos] = 0;
      }
    }
    return false;
  }
  fill(0);
  return g;
}

function canPlace(g, r, c, v) {
  for (let k = 0; k < 9; k++) {
    if (k !== c && g[idx(r, k)] === v) return false;
    if (k !== r && g[idx(k, c)] === v) return false;
  }
  const br = r - (r % 3), bc = c - (c % 3);
  for (let i = br; i < br + 3; i++)
    for (let j = bc; j < bc + 3; j++)
      if ((i !== r || j !== c) && g[idx(i, j)] === v) return false;
  return true;
}

// Генерация головоломки с ЕДИНСТВЕННЫМ решением
function generate(difficulty = 'medium', rnd = Math.random) {
  const target = (DIFFICULTIES[difficulty] || DIFFICULTIES.medium).holes;
  const solution = randomFullGrid(rnd);
  const puzzle = solution.slice();
  let holes = 0;
  for (const i of shuffle([...Array(81).keys()], rnd)) {
    if (holes >= target) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = keep; // решение перестало быть единственным
    else holes++;
  }
  return { puzzle, solution, difficulty, holes };
}

// Множество индексов клеток, нарушающих правила (повтор в строке/столбце/квадрате)
function findConflicts(g) {
  const bad = new Set();
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v && !canPlace(g, Math.floor(i / 9), i % 9, v)) bad.add(i);
  }
  return bad;
}

const isSolved = (g, solution) => g.every((v, i) => v === solution[i]);

const toString81 = (g) => g.join('');
const fromString81 = (s) => s.split('').map((ch) => Number(ch) || 0);

module.exports = {
  DIFFICULTIES, idx, boxOf, countSolutions, solve, canPlace,
  generate, findConflicts, isSolved, toString81, fromString81,
};
