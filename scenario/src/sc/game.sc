theme: /

    state: НоваяИгра
        q!: [начни | начать | давай | хочу | запусти | сыграем] [в] (новая | новую | новой | заново | ещё | еще | другая | другую) [игра | игру | судоку | партию] [$AnyText]
        q!: (лёгкая | легкая | лёгкую | легкую | простая | простую | средняя | среднюю | обычная | обычную | сложная | сложную | трудная | трудную) [игра | игру | уровень | судоку]
        q!: [уровень | сложность] (лёгкий | легкий | средний | сложный | трудный)
        script:
            $reactions.answer(handleNewGame($context));
            addSuggestions(["Подсказка", "Проверь", "Помощь"], $context);

    state: Подсказка
        q!: (подсказка | подсказку | подскажи | помоги | помогите | дай подсказку | не знаю что ставить)
        script:
            if (!has_game(get_app_state($context))) {
                $reactions.answer(NO_GAME);
            } else {
                # Фронтенд сам выберет клетку и пришлёт событие hint_result (см. events.sc)
                simpleAction("hint", $context);
            }

    state: Проверка
        q!: (проверь | проверка | проверить | проверь меня | есть ошибки | где ошибки | где ошибка) [$AnyText]
        script:
            if (!has_game(get_app_state($context))) {
                $reactions.answer(NO_GAME);
            } else {
                # Результат проверки придёт событием check_result
                simpleAction("check", $context);
            }

    state: Отмена
        q!: (отмени | отмена | отменить | верни | вернуть | назад | откати) [ход | последний ход]
        script:
            simpleAction("undo", $context);
            $reactions.answer("Отменила последний ход.");

    state: Решение
        q!: (сдаюсь | я сдаюсь | покажи решение | покажи ответ | реши [за меня] | реши судоку)
        script:
            if (!has_game(get_app_state($context))) {
                $reactions.answer(NO_GAME);
            } else {
                simpleAction("solve", $context);
                $reactions.answer("Вот решение. Скажи «новая игра», чтобы попробовать ещё раз.");
                addSuggestions(["Новая игра", "Лёгкая игра"], $context);
            }

    state: Рекорды
        q!: [покажи | открой] (рекорды | рекордов | таблица рекордов | таблицу рекордов | лидеры | лидеров | результаты)
        script:
            simpleAction("show_leaders", $context);
            $reactions.answer("Открываю таблицу рекордов.");

    state: Закрыть
        q!: (закрой | скрой | убери | продолжить | продолжаем | вернись к игре) [окно | таблицу | правила | рекорды]
        script:
            simpleAction("close_overlay", $context);
            $reactions.answer("Продолжаем.");
