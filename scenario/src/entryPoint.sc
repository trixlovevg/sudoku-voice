require: slotfilling/slotFilling.sc
  module = sys.zb-common

# JavaScript-обработчики (ES5)
require: js/getters.js
require: js/reply.js
require: js/actions.js
require: js/parse.js
require: js/game.js

# Сценарные файлы
require: sc/game.sc
require: sc/moves.sc
require: sc/help.sc
require: sc/events.sc

patterns:
    $AnyText = $nonEmptyGarbage

theme: /

    state: Start
        # Запуск с кнопки — приходит /start
        q!: $regex</start>
        # Запуск голосом. ВАЖНО: фраза должна совпадать с REACT_APP_SMARTAPP
        # (initPhrase = "Запусти " + REACT_APP_SMARTAPP), иначе сработает Fallback.
        q!: (запусти | открой | включи | вруби | давай сыграем в) [игру] судоку [голосом]
        script:
            $reactions.answer("Привет! Это судоку, в которое можно играть голосом. Выбери уровень: лёгкий, средний или сложный — или просто скажи «новая игра».");
            addSuggestions(["Лёгкая игра", "Средняя игра", "Сложная игра", "Правила"], $context);

    state: Fallback
        event!: noMatch
        script:
            log("Fallback: query = " + $request.query);
            $reactions.answer("Не поняла. Скажи, например: «строка 3 столбец 4 цифра 5», «подсказка» или «помощь».");
            addSuggestions(DEFAULT_SUGGESTIONS, $context);
