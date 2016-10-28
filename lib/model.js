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

myModel.prototype.getUsers = function(callback) {
    this.db.all('SELECT * FROM users', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR : ', err);
        }

        if(typeof callback === 'function') {
            callback(record);
        }
    });
};

myModel.prototype.getActiveUsers = function(callback) {
    this.db.all('SELECT * FROM users WHERE is_enabled = 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR : ', err);
        }

        if(typeof callback === 'function') {
            callback(record);
        }
    });
};

myModel.prototype.getQuestions = function(callback) {
    this.db.all('SELECT * FROM questions', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR : ', err);
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
        ' WHERE questions_users.date = "' + date + '"' +
        ' AND questions_users.user_id = "' + user + '"';

    this.db.all(query, function(err, record) {
        if(err) {
            return console.error('DATABASE ERROR:', err);
        }

        if(typeof callback === 'function') {
            callback(record);
        }
    });
};

myModel.prototype.getUsersQuestionByDate = function(date, callback) {
    this.db.all(
        'SELECT DISTINCT questions_users.user_id' +
        ' FROM questions_users' +
        ' WHERE questions_users.date = "' + date + '"',
        function(err, record) {
            if(err) {
                return console.error('DATABASE ERROR:', err);
            }

            if(typeof callback === 'function') {
                callback(record);
            }
        }
    )
};

myModel.prototype.saveAnswer = function(user, question, answer, date, posted_ts) {
    var self = this;

    this.db.get(
        'SELECT * FROM questions_users' +
        ' WHERE user_id = "' + user + '"' +
        ' AND question_id = ' + question +
        ' AND date = "' + date + '"',
        function(err, record) {
            if(err) {
                return console.error('DATABASE ERROR:', err);
            }

            if(record) {
                self.updateAnswer(user, question, answer, date, posted_ts);
            } else {
                self.createAnswer(user, question, answer, date, posted_ts);
            }
        }
    );
};

myModel.prototype.updateAnswer = function(user, question, answer, date, posted_ts) {
    this.db.run(
        'UPDATE questions_users SET answer = "' + answer + '", posted_ts = "' + posted_ts + '"' +
        ' WHERE user_id = "' + user + '"' +
        ' AND question_id = ' + question +
        ' AND date = "' + date + '"'
    );
};

myModel.prototype.createAnswer = function(user, question, answer, date, posted_ts) {
    this.db.run(
        'INSERT INTO questions_users (user_id, question_id, answer, date, posted_ts) ' +
        'VALUES("' + user + '", ' + question + ', "' + answer + '", "' + date + '", "' + posted_ts +'")'
    );
};