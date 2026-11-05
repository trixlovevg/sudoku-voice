// =====================================================================
// Формирование ответов (как в todo-canvas-app преподавателя).
// addAction() кладёт в ответ команду smart_app_data — её получает
// фронтенд в обработчике assistant.on('data', ...).
// =====================================================================

function reply(body, response) {
    var replyData = { type: "raw", body: body };
    response.replies = response.replies || [];
    response.replies.push(replyData);
}

function addAction(action, context) {
    var command = { type: "smart_app_data", action: action };
    for (var i = 0; context.response.replies && i < context.response.replies.length; i++) {
        var r = context.response.replies[i];
        if (r.type === "raw" && r.body && r.body.items) {
            r.body.items.push({ command: command });
            return;
        }
    }
    return reply({ items: [{ command: command }] }, context.response);
}

function addSuggestions(suggestions, context) {
    var buttons = [];
    suggestions.forEach(function (s) {
        buttons.push({ action: { text: s, type: "text" }, title: s });
    });
    reply({ suggestions: { buttons: buttons } }, context.response);
}

var DEFAULT_SUGGESTIONS = ["Подсказка", "Проверь", "Новая игра", "Помощь"];
