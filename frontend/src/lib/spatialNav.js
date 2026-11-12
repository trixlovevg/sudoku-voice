// =====================================================================
// Пространственная навигация для пульта ТВ (SberBox, Салют ТВ) и клавиатуры.
// Стрелка переводит фокус на ближайший элемент в нужном направлении:
// кнопку, поле ввода или игровое поле (.board). Клетки поля сами по себе
// не фокусируются — внутри поля стрелки двигают выделенную клетку (App.jsx).
// =====================================================================

// Поле ввода имени сюда не входит: с пульта его не заполняют, а фокус в нём
// открывает экранную клавиатуру. Имя можно изменить касанием или мышью.
const SELECTOR = 'button:not([disabled]), .board';

function isVisible(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Все элементы, на которые можно перейти (внутри root — например, открытого окна)
export function focusables(root = document) {
  return [...root.querySelectorAll(SELECTOR)].filter(
    (el) =>
      isVisible(el) &&
      !el.classList.contains('board-done') && // решённое поле — уже не цель для фокуса
      !(el.closest('.board') && !el.classList.contains('board'))
  );
}

// Расстояние между отрезками [a1, a2] и [b1, b2] (0, если они перекрываются)
function gap(a1, a2, b1, b2) {
  if (a2 < b1) return b1 - a2;
  if (b2 < a1) return a1 - b2;
  return 0;
}

// Ближайший элемент в направлении dir ('up' | 'down' | 'left' | 'right')
// от прямоугольника from. Возвращает null, если в этом направлении ничего нет.
export function findNext(from, dir, root = document, exclude = null) {
  let best = null;
  let bestScore = Infinity;
  for (const el of focusables(root)) {
    if (el === exclude) continue;
    const r = el.getBoundingClientRect();
    let main;
    let cross;
    if (dir === 'up') {
      if (r.bottom > from.top + 1) continue;
      main = from.top - r.bottom;
      cross = gap(from.left, from.right, r.left, r.right);
    } else if (dir === 'down') {
      if (r.top < from.bottom - 1) continue;
      main = r.top - from.bottom;
      cross = gap(from.left, from.right, r.left, r.right);
    } else if (dir === 'left') {
      if (r.right > from.left + 1) continue;
      main = from.left - r.right;
      cross = gap(from.top, from.bottom, r.top, r.bottom);
    } else {
      if (r.left < from.right - 1) continue;
      main = r.left - from.right;
      cross = gap(from.top, from.bottom, r.top, r.bottom);
    }
    // Элементы «на одной линии» важнее ближних, но смещённых вбок
    const score = main + cross * 3;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export function focusFirst(root = document) {
  const first = focusables(root)[0];
  if (first) first.focus();
  return first;
}
