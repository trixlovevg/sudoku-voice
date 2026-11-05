theme: /

    # =================================================================
    # События, которые присылает ФРОНТЕНД через assistant.sendData():
    #   sendData({ action: { action_id: "game_won", parameters: {...} } })
    # action_id становится именем события, parameters -> eventData.
    # Так ассистент озвучивает то, что знает только интерфейс.
    # =================================================================

    state: ПодсказкаРезультат
        event!: hint_result
        script:
            var d = get_event_data($context);
            if (d.row) {
                $reactions.answer("Подсказка: в строке " + d.row + ", столбце " + d.col + " стоит " + d.value + ".");
            } else {
                $reactions.answer("Подсказывать нечего — все клетки заполнены. Скажи «проверь».");
            }

    state: ПроверкаРезультат
        event!: check_result
        script:
            var d = get_event_data($context);
            if (d.errors > 0) {
                $reactions.answer("Ошибок: " + d.errors + ". Я подсветила их красным. Пустых клеток: " + d.empty + ".");
            } else if (d.empty > 0) {
                $reactions.answer("Пока всё верно! Осталось заполнить " + d.empty + ".");
            } else {
                $reactions.answer("Всё верно!");
            }

    state: Победа
        event!: game_won
        script:
            var d = get_event_data($context);
            var text = "Поздравляю, судоку решено! Время: " + formatTime(d.seconds || 0) + ".";
            if (d.hints > 0) text += " Подсказок: " + d.hints + ".";
            if (d.rank) text += " Это " + d.rank + " место в таблице рекордов.";
            $reactions.answer(text + " Сыграем ещё?");
            addSuggestions(["Новая игра", "Сложная игра", "Рекорды"], $context);
