// =====================================================================
// Backend «Судоку голосом» на Node.js + Express.
//   GET  /api/health                 — проверка, что сервер жив
//   GET  /api/puzzle?difficulty=easy  — новая головоломка (easy|medium|hard)
//   POST /api/solve   {puzzle: "81 символ"} — решение (для проверки/отладки)
//   GET  /api/scores?difficulty=hard  — таблица рекордов
//   POST /api/scores  {name, difficulty, seconds, hints} — сохранить результат
// В продакшене этот же сервер раздаёт собранный фронтенд (frontend/build),
// поэтому всё приложение живёт по одному адресу.
// =====================================================================
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sudoku = require('./sudoku');
const storage = require('./storage');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/api/puzzle', (req, res) => {
  const difficulty = sudoku.DIFFICULTIES[req.query.difficulty] ? req.query.difficulty : 'medium';
  const { puzzle, solution } = sudoku.generate(difficulty);
  res.json({
    id: Date.now().toString(36),
    difficulty,
    puzzle: sudoku.toString81(puzzle),
    solution: sudoku.toString81(solution),
  });
});

app.post('/api/solve', (req, res) => {
  const s = String(req.body.puzzle || '');
  if (!/^[0-9.]{81}$/.test(s)) return res.status(400).json({ error: 'Нужна строка из 81 символа (0 или . — пустая клетка)' });
  const solution = sudoku.solve(sudoku.fromString81(s.replace(/\./g, '0')));
  if (!solution) return res.status(422).json({ error: 'Решений нет' });
  res.json({ solution: sudoku.toString81(solution) });
});

app.get('/api/scores', (req, res) => {
  res.json(storage.topScores(req.query.difficulty, Number(req.query.limit) || 10));
});

app.post('/api/scores', (req, res) => {
  const { name, difficulty, seconds, hints } = req.body || {};
  if (!sudoku.DIFFICULTIES[difficulty] || !(seconds >= 0)) {
    return res.status(400).json({ error: 'Некорректные данные результата' });
  }
  res.status(201).json(storage.addScore({ name, difficulty, seconds, hints: hints || 0 }));
});

// Раздача собранного фронтенда (после `npm run build` в папке frontend)
const buildDir = path.join(__dirname, '..', '..', 'frontend', 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(buildDir, 'index.html')));
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Sudoku backend: http://localhost:${PORT}`));
}

module.exports = app;
