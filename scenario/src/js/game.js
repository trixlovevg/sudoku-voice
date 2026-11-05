// =====================================================================
// Обработчики голосовых команд. Каждая функция:
//   1) читает фразу пользователя и состояние поля с фронтенда,
//   2) добавляет команду для фронтенда (addAction),
//   3) возвращает текст, который ассистент произнесёт.
// =====================================================================

var NO_GAME = "Сначала начни игру — скажи «новая игра».";

function user_text(context) {
    return (context && context.request && context.request.query) || "";
}

function has_game(state) {
    return state && state.board && state.board.length === 81 && state.status !== "idle";
}

function handleMove(context) {
    // Фраза могла попасть сюда по паттерну «… строка …», хотя это стирание или выбор
    var first = String(user_text(context)).toLowerCase().split(" ")[0];
    if (/^(сотри|стере|стёр|очист|удали|убери)/.test(first)) return handleErase(context);
    if (/^(выбери|выбра|перейди|иди|отметь)/.test(first)) return handleSelect(context);

    var state = get_app_state(context);
    if (!has_game(state)) return NO_GAME;

    var m = parseMove(user_text(context));
    if (m.value === null && m.row !== null && m.col !== null) {
        // Сказали только координаты — просто выбираем клетку
        selectCell(m.row, m.col, context);
        return "Строка " + m.row + ", столбец " + m.col + ". Какую цифру поставить?";
    }
    if (m.value === null) {
        return "Не расслышала цифру. Скажи, например: «поставь 5 в строку 3 столбец 4».";
    }
    if (m.row === null || m.col === null) {
        var sel = selected_cell(state);
        if (!sel) return "Сначала выбери клетку: «строка 3 столбец 4», или назови цифру вместе с клеткой.";
        m.row = sel.row;
        m.col = sel.col;
    }
    if (cell_is_fixed(state, m.row, m.col)) {
        selectCell(m.row, m.col, context);
        return "В строке " + m.row + ", столбце " + m.col + " стоит исходная цифра, её менять нельзя.";
    }

    setValue(m.row, m.col, m.value, context);
    var conflict = find_conflict(state, m.row, m.col, m.value);
    var text = "Ставлю " + m.value + " в строку " + m.row + ", столбец " + m.col + ".";
    if (conflict) text += " Осторожно: цифра " + m.value + " уже есть в " + conflict + ".";
    return text;
}

function handleSelect(context) {
    var state = get_app_state(context);
    if (!has_game(state)) return NO_GAME;
    var c = parseCell(user_text(context));
    if (c.row === null || c.col === null) return "Назови клетку так: «строка 3 столбец 4».";
    selectCell(c.row, c.col, context);
    var v = cell_value(state, c.row, c.col);
    return "Строка " + c.row + ", столбец " + c.col + (v ? ", там " + v + "." : ", клетка пустая.");
}

function handleErase(context) {
    var state = get_app_state(context);
    if (!has_game(state)) return NO_GAME;
    var c = parseCell(user_text(context));
    if (c.row === null || c.col === null) {
        var sel = selected_cell(state);
        if (!sel) return "Какую клетку стереть? Например: «сотри строку 2 столбец 5».";
        c = sel;
    }
    if (cell_is_fixed(state, c.row, c.col)) return "Это исходная цифра, её стереть нельзя.";
    if (!cell_value(state, c.row, c.col)) return "Эта клетка и так пустая.";
    eraseCell(c.row, c.col, context);
    return "Стёрла строку " + c.row + ", столбец " + c.col + ".";
}

function handleNewGame(context) {
    var difficulty = parseDifficulty(user_text(context));
    var state = get_app_state(context);
    if (!difficulty) difficulty = state.difficulty || "medium";
    newGame(difficulty, context);
    return "Новая игра, уровень " + DIFFICULTY_NAMES[difficulty] + ". Называй клетку и цифру, например: «строка 1 столбец 2 цифра 7».";
}

function handleMoveSelection(context) {
    var state = get_app_state(context);
    if (!has_game(state)) return NO_GAME;
    var dir = parseDirection(user_text(context));
    if (!dir) return "Куда сдвинуть: вверх, вниз, влево или вправо?";
    moveSelection(dir, context);
    return "";
}
