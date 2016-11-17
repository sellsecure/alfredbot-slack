var parameters = {
    nullAnswerRegExp: /^(nothing|none|no|~+|-+| +|\.+)$/i,
    
    messages: {
        report: {
            doneToday: 'Vous avez déjà répondu pour aujourd\'hui !',
            emptyAnswers: '_Mais n\'avait rien à dire..._',
            closeNew: 'Merci !',
            nothingAt: 'Aucun utilisateur n\'a participé au stand à cette date : '
        }
    }
};

module.exports = parameters;
