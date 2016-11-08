'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();

var myModel = function Constructor(dbName) {
    this.dbPath = path.resolve(process.cwd(), 'data', dbName);

    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

module.exports = myModel;

myModel.prototype.getQuestions = function(callback) {
    this.db.all('SELECT * FROM questions', function (err, record) {
        if (err) {
            return console.error('myModel.getQuestions - DATABASE ERROR : ', err);
        }

        if(typeof callback === 'function') {
            callback(record);
        }
    });
};

myModel.prototype.getQuestionsByUserAndByDate = function(user, date, callback) {
    var query = 'SELECT questions.*, questions_users.answer' +
        ' FROM questions' +
        ' JOIN questions_users ON questions.id = questions_users.question_id' +
        ' WHERE questions_users.date = $date' +
        ' AND questions_users.user_id = $user';

    this.db.all(
        query,
        {
            $date: date,
            $user: user
        },
        function(err, record) {
            if(err) {
                return console.error('myModel.getQuestionsByUserAndByDate - DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    );
};

myModel.prototype.getUsersQuestionByDate = function(date, callback) {
    this.db.all(
        'SELECT DISTINCT questions_users.user_id' +
        ' FROM questions_users' +
        ' WHERE questions_users.date = $date',
        {
            $date: date
        },
        function(err, record) {
            if(err) {
                return console.error('myModel.getUsersQuestionByDate - DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    )
};

myModel.prototype.getAnswers = function(user, date, questions, callback) {
    var query = 'SELECT * FROM questions_users' +
        ' WHERE user_id = $user' +
        ' AND question_id IN (' + questions + ')' +
        ' AND date = $date';

    this.db.all(
        query,
        {
            $user: user,
            $date: date
        },
        function(err, record) {
            if(err) {
                return console.error('myModel.getAnswers - DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    );
};

myModel.prototype.saveAnswer = function(user, question, answer, date, posted_ts, callback) {
    var self = this;

    this.db.get(
        'SELECT * FROM questions_users' +
        ' WHERE user_id = $user' +
        ' AND question_id = $question' +
        ' AND date = $date',
        {
            $user: user,
            $question: question,
            $date: date
        },
        function(err, record) {
            if(err) {
                return console.error('myModel..saveAnswer DATABASE ERROR:', err);
            }

            if(record) {
                self.updateAnswer(user, question, answer, date, posted_ts, callback);
            } else {
                self.createAnswer(user, question, answer, date, posted_ts, callback);
            }
        }
    );
};

myModel.prototype.updateAnswer = function(user, question, answer, date, posted_ts, callback) {
    var query = 'UPDATE questions_users SET answer = $answer, posted_ts = $posted_ts' +
        ' WHERE user_id = $user' +
        ' AND question_id = $question' +
        ' AND date = $date';

    this.db.run(
        query,
        {
            $answer: answer,
            $posted_ts: posted_ts,
            $user: user,
            $question: question,
            $date: date
        },
        function(err, record) {
            if(err) {
                return console.error('myModel.updateAnswers - DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    );
};

myModel.prototype.createAnswer = function(user, question, answer, date, posted_ts, callback) {
    var query = 'INSERT INTO questions_users (user_id, question_id, answer, date, posted_ts) ' +
        'VALUES($user, $question, $answer, $date, $posted_ts)';

    this.db.run(
        query,
        {
            $user: user,
            $question: question,
            $answer: answer,
            $date: date,
            $posted_ts: posted_ts
        },
        function(err, record) {
            if(err) {
                return console.error('myModel.createAnswers - DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    );
};