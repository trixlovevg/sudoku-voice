// Запуск: npm test (встроенный в Node.js тест-раннер, Node 18+)
const test = require('node:test');
const assert = require('node:assert');
const s = require('../src/sudoku');

test('сгенерированная головоломка имеет единственное решение', () => {
  for (const d of ['easy', 'medium', 'hard']) {
    const { puzzle, solution } = s.generate(d);
    assert.strictEqual(s.countSolutions(puzzle, 2), 1);
    assert.deepStrictEqual(s.solve(puzzle), solution);
    assert.strictEqual(puzzle.filter((v) => v === 0).length, s.DIFFICULTIES[d].holes);
  }
});

test('решение не нарушает правила', () => {
  const { solution } = s.generate('easy');
  assert.strictEqual(s.findConflicts(solution).size, 0);
});

test('findConflicts находит повтор в строке', () => {
  const g = new Array(81).fill(0);
  g[0] = 5; g[8] = 5;
  assert.deepStrictEqual([...s.findConflicts(g)].sort((a, b) => a - b), [0, 8]);
});

test('противоречивое поле не имеет решений', () => {
  const g = new Array(81).fill(0);
  g[0] = 1; g[1] = 1;
  assert.strictEqual(s.countSolutions(g, 2), 0);
});
