// =====================================================================
// Чтение данных запроса. Состояние фронтенда (то, что возвращает getState()
// в React-приложении) приходит в payload.meta.current_app.state.
// =====================================================================

function get_request(context) {
    if (context && context.request) return context.request.rawRequest;
    return {};
}

function get_app_state(context) {
    var request = get_request(context);
    if (request && request.payload && request.payload.meta &&
        request.payload.meta.current_app && request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state;
    }
    return {};
}

// Данные, отправленные фронтендом через assistant.sendData({action: {action_id, parameters}})
function get_event_data(context) {
    return (context && context.request && context.request.data && context.request.data.eventData) || {};
}

// Значение клетки по строке/столбцу (1..9) из состояния фронтенда.
// state.board — строка из 81 символа, state.fixed — маска исходных цифр ("1" — исходная)
function cell_value(state, row, col) {
    if (!state.board) return 0;
    return Number(state.board.charAt((row - 1) * 9 + (col - 1))) || 0;
}

function cell_is_fixed(state, row, col) {
    if (!state.fixed) return false;
    return state.fixed.charAt((row - 1) * 9 + (col - 1)) === "1";
}

// Проверка правил: где ещё стоит такая же цифра (без учёта самой клетки)
function find_conflict(state, row, col, value) {
    if (!state.board) return null;
    for (var k = 1; k <= 9; k++) {
        if (k !== col && cell_value(state, row, k) === value) return "этой строке";
        if (k !== row && cell_value(state, k, col) === value) return "этом столбце";
    }
    var br = Math.floor((row - 1) / 3) * 3, bc = Math.floor((col - 1) / 3) * 3;
    for (var r = br + 1; r <= br + 3; r++) {
        for (var c = bc + 1; c <= bc + 3; c++) {
            if ((r !== row || c !== col) && cell_value(state, r, c) === value) return "этом квадрате";
        }
    }
    return null;
}

function selected_cell(state) {
    if (state.selected && state.selected.row && state.selected.col) return state.selected;
    return null;
}
