'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var config = require('../config.js');

var dbPath = path.resolve(process.cwd(), 'data', config.dbName);

console.log('Check if DB exist')

if (! fs.existsSync(dbPath)) {
    console.log('Create DB ' + config.dbName);
    fs.writeFile(dbPath, '', function(err) {
        if(err) {
            return console.log(err);
        }

        // Connect to the db
        var db = new SQLite.Database(dbPath);

        // Create table questions
        db.run('CREATE TABLE `questions` (' +
            ' `id`	INTEGER PRIMARY KEY AUTOINCREMENT,' +
            ' `value`	TEXT,' +
            ' `color`	TEXT' +
            ')',
            function () {
                db.run(
                    'INSERT INTO questions (value, color) VALUES($value, $color)',
                    {
                        $value: 'How are you today ?',
                        $color: '123456'
                    }
                );
            }
        );


        // Create table questions_users
        db.run('CREATE TABLE `questions_users` (' +
            ' `question_id`	INTEGER,' +
            ' `user_id`	TEXT,' +
            ' `date`	TEXT,' +
            ' `answer`	TEXT,' +
            ' `posted_ts`	TEXT,' +
            ' PRIMARY KEY(`question_id`,`user_id`,`date`)' +
        ');');

        return console.log("DB created !");
    });
} else {
    console.log('OK database ' + config.dbName + ' already exist');
}