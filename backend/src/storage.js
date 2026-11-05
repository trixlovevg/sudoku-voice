// Простое хранилище рекордов в JSON-файле (без базы данных и нативных модулей —
// работает на Windows/macOS/Linux без компиляции).
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'scores.json');
const MAX_SCORES = 500;

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(scores) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(scores, null, 2), 'utf8');
}

// Очки: чем быстрее и меньше подсказок — тем лучше
function scoreOf({ seconds, hints, difficulty }) {
  const k = { easy: 1, medium: 2, hard: 3 }[difficulty] || 1;
  return Math.max(0, Math.round(k * 10000 - seconds * 5 - hints * 300));
}

function addScore({ name, difficulty, seconds, hints }) {
  const entry = {
    name: String(name || 'Игрок').trim().slice(0, 24) || 'Игрок',
    difficulty,
    seconds: Math.round(seconds),
    hints: Math.round(hints),
    date: new Date().toISOString(),
  };
  entry.score = scoreOf(entry);
  const scores = load();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  save(scores.slice(0, MAX_SCORES));
  return { entry, rank: scores.indexOf(entry) + 1 };
}

function topScores(difficulty, limit = 10) {
  return load()
    .filter((s) => !difficulty || s.difficulty === difficulty)
    .slice(0, limit);
}

module.exports = { addScore, topScores, scoreOf };
