// =====================================================================
// Разбор голосовых фраз. ВАЖНО: в SmartApp Code используется движок
// JavaScript уровня ES5 — без let/const, стрелочных функций и шаблонных строк.
// =====================================================================

// Слова -> цифры. Сначала точные совпадения, потом основы (порядковые: «третью», «пятой»…)
var NUMBER_WORDS = {
    "один": 1, "одна": 1, "одну": 1, "раз": 1, "единица": 1, "единицу": 1, "единичку": 1, "кол": 1,
    "два": 2, "две": 2, "двойка": 2, "двойку": 2, "двоечку": 2,
    "три": 3, "тройка": 3, "тройку": 3, "троечку": 3,
    "четыре": 4, "четверка": 4, "четвёрка": 4, "четверку": 4, "четвёрку": 4,
    "пять": 5, "пятерка": 5, "пятёрка": 5, "пятерку": 5, "пятёрку": 5,
    "шесть": 6, "шестерка": 6, "шестёрка": 6, "шестерку": 6, "шестёрку": 6,
    "семь": 7, "семерка": 7, "семёрка": 7, "семерку": 7, "семёрку": 7,
    "восемь": 8, "восьмерка": 8, "восьмёрка": 8, "восьмерку": 8, "восьмёрку": 8,
    "девять": 9, "девятка": 9, "девятку": 9
};

var ORDINAL_STEMS = [
    ["перв", 1], ["втор", 2], ["трет", 3], ["четвер", 4], ["пят", 5],
    ["шест", 6], ["седьм", 7], ["восьм", 8], ["девят", 9]
];

var ROW_WORDS = /^(строк|ряд|линия|линию|линии)/;
var COL_WORDS = /^(столб|колонк|колонн|вертикал)/;
var VALUE_WORDS = /^(цифр|числ|значени)/;
var PUT_VERBS = /^(постав|став|впиш|запиш|напиш|встав|пиши|вбей|введи)/;

function wordToNumber(token) {
    if (/^[1-9]$/.test(token)) return Number(token);
    if (NUMBER_WORDS[token]) return NUMBER_WORDS[token];
    for (var i = 0; i < ORDINAL_STEMS.length; i++) {
        if (token.indexOf(ORDINAL_STEMS[i][0]) === 0) return ORDINAL_STEMS[i][1];
    }
    return null;
}

function tokenize(text) {
    var t = String(text || "").toLowerCase().replace(/ё/g, "е");
    // «345» или «3,4,5» -> отдельные цифры; «3-я» -> «3»
    t = t.replace(/(\d)-?(ой|ую|ая|й|я|ю|е)(?=[^а-я]|$)/g, "$1");
    t = t.replace(/\d/g, " $& ");
    return t.split(/[^a-zа-я0-9]+/).filter(function (x) { return x.length > 0; });
}

// Возвращает {row, col, value} — каждое поле число 1..9 или null.
// Примеры: «поставь 5 в строку 3 столбец 4», «строка 3 столбец 4 цифра 5»,
//          «третья строка четвёртый столбец пятёрка», «3 4 5», «пять»
function parseMove(text) {
    var tokens = tokenize(text);
    var res = { row: null, col: null, value: null };
    var pending = null;       // какое поле ждёт следующего числа
    var free = [];            // числа без подписи
    var startsWithVerb = tokens.length > 0 && PUT_VERBS.test(tokens[0]);

    for (var i = 0; i < tokens.length; i++) {
        var tok = tokens[i];
        var num = wordToNumber(tok);
        if (ROW_WORDS.test(tok)) { pending = "row"; continue; }
        if (COL_WORDS.test(tok)) { pending = "col"; continue; }
        if (VALUE_WORDS.test(tok)) { pending = "value"; continue; }
        if (num === null) continue;
        // 1) «строка 3» — число ПОСЛЕ подписи
        if (pending && res[pending] === null) { res[pending] = num; pending = null; continue; }
        // 2) «третья строка», «3-ю строку» — число ПЕРЕД подписью
        var next = tokens[i + 1] || "";
        if (ROW_WORDS.test(next) && res.row === null) { res.row = num; i++; continue; }
        if (COL_WORDS.test(next) && res.col === null) { res.col = num; i++; continue; }
        free.push(num);
    }

    var order = startsWithVerb ? ["value", "row", "col"] : ["row", "col", "value"];
    // Если число одно и строка/столбец не названы — это цифра для выбранной клетки
    if (free.length === 1 && res.row === null && res.col === null) order = ["value"];
    for (var k = 0; k < order.length && free.length > 0; k++) {
        if (res[order[k]] === null) res[order[k]] = free.shift();
    }
    return res;
}

// Только координаты клетки (для «выбери клетку…», «сотри…»)
function parseCell(text) {
    var m = parseMove(text);
    if (m.row === null && m.col === null) return { row: null, col: null };
    // «выбери 3 4»: два свободных числа попадут в row/col (порядок без глагола-«поставь»)
    if (m.col === null && m.value !== null) { m.col = m.value; }
    return { row: m.row, col: m.col };
}

function parseDifficulty(text) {
    var t = String(text || "").toLowerCase().replace(/ё/g, "е");
    if (/(легк|прост|нович|детск)/.test(t)) return "easy";
    if (/(сложн|трудн|тяжел|эксперт|хардкор)/.test(t)) return "hard";
    if (/(средн|обычн|нормал)/.test(t)) return "medium";
    return null;
}

function parseDirection(text) {
    var t = String(text || "").toLowerCase();
    if (/(вверх|выше|наверх)/.test(t)) return "up";
    if (/(вниз|ниже)/.test(t)) return "down";
    if (/(влево|левее|налево)/.test(t)) return "left";
    if (/(вправо|правее|направо)/.test(t)) return "right";
    return null;
}

var DIFFICULTY_NAMES = { easy: "лёгкий", medium: "средний", hard: "сложный" };

// Склонение «секунда/секунды/секунд»
function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
}

function formatTime(seconds) {
    var m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
    var parts = [];
    if (m > 0) parts.push(m + " " + plural(m, "минуту", "минуты", "минут"));
    parts.push(s + " " + plural(s, "секунду", "секунды", "секунд"));
    return parts.join(" ");
}
