// =====================================================================
// Команды для фронтенда. Поле type обрабатывается в
// frontend/src/App.jsx -> dispatchAssistantAction().
// row/col/value передаются в «человеческой» нумерации 1..9.
// =====================================================================

function newGame(difficulty, context) {
    addAction({ type: "new_game", difficulty: difficulty || "medium" }, context);
}

function setValue(row, col, value, context) {
    addAction({ type: "set_value", row: row, col: col, value: value }, context);
}

function eraseCell(row, col, context) {
    addAction({ type: "erase", row: row, col: col }, context);
}

function selectCell(row, col, context) {
    addAction({ type: "select", row: row, col: col }, context);
}

function moveSelection(direction, context) {
    addAction({ type: "move", direction: direction }, context);
}

function simpleAction(type, context) {
    addAction({ type: type }, context);
}
