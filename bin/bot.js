'use strict';

var StandBot    = require('../lib/standbot');
var schedule    = require('node-schedule');
var model       = require('../lib/model.js');
var moment      = require('moment-timezone');
var config      = require('../config.js');

var myModel     = new model(config.dbName);
var listUsers   = [];

var bot = new StandBot({
    token:  config.slack.token,
    name:   config.slack.botName
});

bot.run();

// Open RTM
bot.openRTM(function(server) {
    console.log('Server launched');
    console.log('---------------');

    server.on('message', function(response) {
        response = JSON.parse(response);

        var doAskBot = true;

        if(response.type == 'message') {
            // Edited message
            if(typeof response.subtype != 'undefined' && response.subtype == 'message_changed') {
                for(var i = 0; i < listUsers.length; i++) {
                    for(var j = 0; j < listUsers[i].questions.length; j++) {
                        var ts = listUsers[i].questions[j].ts;
                        if(ts == response.previous_message.ts) {
                            listUsers[i].questions[j].answer = response.message.text;

                            // Save questions
                            saveAnswers(listUsers[i]);

                            if(listUsers[i].questions[j].posted_ts
                                && listUsers[i].questions[j].posted_channel) {
                                updateChannelMessage(listUsers[i]);
                            }
                        }
                    }
                }
            }
            // Posted new message
            else {
                if(listUsers.length > 0) {
                    for (var i = 0; i < listUsers.length; i++) {
                        if (listUsers[i].im_id == response.channel
                            && listUsers[i].id == response.user
                            && listUsers[i].waiting_answer) {

                            doAskBot = false;

                            // We receive a message from a user present in the UserList
                            // User is responding to an answer
                            var question_id = listUsers[i].waiting_answer;
                            for (var j = 0; j < listUsers[i].questions.length; j++) {
                                if (question_id == listUsers[i].questions[j].id) {
                                    listUsers[i].questions[j].answer = response.text;
                                    listUsers[i].questions[j].ts = response.ts;
                                }
                            }
                            listUsers[i].waiting_answer = false;

                            // Save questions
                            var user = listUsers[i];
                            saveAnswers(user, function(response) {
                                sendQuestion(user, function (response) {
                                    if (!response) {
                                        bot.sendMessage(user.id, {text: 'Merci !'});

                                        sendToChannel(user, config.channel);
                                    }
                                });
                            });

                        }
                    }
                }

                if(doAskBot) {
                    askBot(response);
                }
            }
        }
    });
});

// Get user when launch the script (we need to always have this users)
getUsers();

// Launch scheduled program
schedule.scheduleJob('0 ' + config.schedule.minute + ' * * * 1-5', function() {
    getUsers(function() {
        for(var i = 0; i < listUsers.length; i ++) {
            if(config.schedule.hour == moment().tz(listUsers[i].tz).format("HH")) {
                sendQuestion(listUsers[i]);
            }
        }
    });
});

/**
 * Get list Users
 * @param callback
 */
function getUsers(callback) {
    bot.getChannel(config.channel, function(id) {
        bot.getMembersChannel(id, function(response) {
            bot.getDetailUsersList(response, function(response) {
                listUsers = response;
                myModel.getQuestions(function(response) {
                    for(var i = 0; i < listUsers.length; i++) {

                        var questions = [];

                        for(var j = 0; j < response.length; j++) {
                            var q = new Object();
                            q.id = response[j].id;
                            q.value = response[j].value;
                            q.answer = null;
                            q.ts = null;
                            q.posted_ts = null;
                            q.posted_channel = null;
                            q.date = moment().tz(listUsers[i].tz).format("YYYY-MM-DD");
                            q.color = response[j].color;

                            questions.push(q);
                        }

                        listUsers[i].questions = questions;
                        listUsers[i].waiting_answer = false;
                    }

                    bot.getImListForUser(listUsers, function (response) {
                        listUsers = response;

                        if(typeof callback === 'function') {
                            callback();
                        }
                    });
                });
            });
        });
    });
}

/**
 * Send next Question to user
 *
 * @param object user
 * @param function callback
 */
function sendQuestion(user, callback) {
    var askQuestion = false;

    if(user.waiting_answer == false) {
        var listQIds = [];

        for(var i = 0; i < user.questions.length; i++) {
            listQIds.push(user.questions[i].id);
        }

        var date = moment().tz(user.tz).format("YYYY-MM-DD");

        myModel.getAnswers(
            user.id,
            date,
            listQIds.join(),
            function(answers) {
                for(var i = 0; i < user.questions.length; i++) {
                    for(var j = 0; j < answers.length; j++) {
                        if(answers[j].question_id == user.questions[i].id) {
                            user.questions[i].answer    = answers[j].answer;
                            user.questions[i].posted_ts = answers[j].posted_ts;
                        }
                    }

                    if(user.waiting_answer == false && (user.questions[i].answer == null || user.questions[i].answer == 'null')) {
                        user.waiting_answer = user.questions[i].id;
                        askQuestion = true;
                        var message = new Object();
                        message.text = user.questions[i].value;
                        message.attachments = null;
                        bot.sendMessage(user.im_id, message);
                    }
                }

                if(typeof callback === 'function') {
                    callback(askQuestion);
                }
            }
        );
    } else {
        if(typeof callback === 'function') {
            callback(askQuestion);
        }
    }
}

/**
 * Save user answers
 *
 * @param object user
 */
function saveAnswers(user, callback) {
    var iterator = 0;
    for(var i = 0; i < user.questions.length; i++) {
        myModel.saveAnswer(
            user.id,
            user.questions[i].id,
            user.questions[i].answer,
            user.questions[i].date,
            user.questions[i].posted_ts,
            function(response) {
                iterator++;
                if(iterator == user.questions.length && typeof callback === 'function') {
                    callback(response);
                }
            }
        );
    }
}

/**
 * Send questions results to channel
 *
 * @param object user
 * @param string channel
 */
function sendToChannel(user, channel) {
    var message = generateChannelMessage(user);

    bot.sendPersonnalizedMessage(channel, message, user.name, user.profile.image_48, function(response) {
        for(var i = 0; i < user.questions.length; i++) {
            user.questions[i].posted_ts = response.message.ts;
            user.questions[i].posted_channel = response.channel;
            myModel.saveAnswer(
                user.id,
                user.questions[i].id,
                user.questions[i].answer,
                user.questions[i].date,
                response.message.ts
            );
        }
    });
}

/**
 * Update a message already send to a channel
 *
 * @param object user
 * @param string channel
 */
function updateChannelMessage(user) {
    var message = generateChannelMessage(user);

    bot.updateMessage(user.questions[0].posted_ts, user.questions[0].posted_channel, message);
}

/**
 * Generate the message to send to the channel
 *
 * @param object user
 * @returns {Object}
 */
function generateChannelMessage(user) {
    var message         = new Object();
    message.text        = user.name + ' a posté un statut : ' + moment().tz(user.tz).format('D MMM, YYYY');

    message.attachments = questionsToAttachments(questions, true);

    return message;
}

/**
 * check message when you ask the bot
 *
 * @param message
 */
function askBot(message) {

    var isBot = false;

    // Check if sender message is bot
    if(message.user_profile) {
        if(message.user_profile.name == config.slack.botName) {
            isBot = true;
        }
    }

    // asking bot
    if(message.text && false === isBot) {
        getBotImList(function(botImList) {

            for(var i in botImList) {
                if(message.channel == botImList[i].id) {
                    // asking resume
                    if (message.text.toLowerCase().indexOf('resume') > -1) {
                        var words = message.text.split(' ');
                        var users = [];
                        var date = null;

                        for (var i = 0; i < words.length; i++) {
                            // Check we have an user
                            if (words[i].indexOf('<@') == 0) {
                                users.push(words[i].substring(2, words[i].length - 1));
                            }
                            // Check we have a date
                            else if (words[i].match(/^\d{4}\-\d{2}\-\d{2}$/)) {
                                date = words[i];
                            }
                        }

                        if(date == null) {
                            date = moment().tz('Europe/Brussels').format("YYYY-MM-DD");
                        }

                        if(users.length == 0) {
                            myModel.getUsersQuestionByDate(date, function(response) {
                                if(response.length > 0) {
                                    for(var i = 0; i < response.length; i++) {
                                        doResume(response[i].user_id, date, message.channel);
                                    }
                                } else {
                                    var msg = 'Aucun utilisateur n\'a participé au stand à cette date : ' + date;
                                    bot.sendMessage(message.channel, {text: msg});
                                }
                            });
                        } else {
                            for (var i = 0; i < users.length; i++) {
                                doResume(users[i], date, message.channel);
                            }
                        }
                    }
                    // Asking help
                    else if (message.text.toLowerCase().indexOf('help') > -1) {
                        var msg = 'Pour demander un résumé :\n';
                        msg += '- resume -> résumé de tous les utilisateurs d\'aujourd\'hui\n';
                        msg += '- resume @user_n1 @user_n2 -> résumé des utilisateurs 1 et 2 d\'aujourd\'hui\n';
                        msg += '- resume 2016-12-25 -> résumé de tous les utilisateurs au 25 Déc 2016\n';
                        msg += '- resume @user_n1 @user_n2 2016-12-25 -> résumé des utilisateurs 1 et 2 au 25 Déc 2016\n';

                        bot.sendMessage(message.channel, {text: msg});
                    }

                    // Asking manual report
                    else if (message.text.toLowerCase().indexOf('report') > -1) {
                        for(var i = 0; i < listUsers.length; i++) {
                            var user = listUsers[i];
                            if(message.user == user.id) {
                                sendQuestion(user, function(askUser) {
                                    if(askUser == false) {
                                        bot.sendMessage(message.user, {text: 'Vous avez déjà répondu pour aujourd\'hui !'});
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Generate the resume report
 * @param user_id
 * @param date
 * @param channel
 */
function doResume(user_id, date, channel) {
    bot.getUserInfo(user_id, function(user) {
        myModel.getQuestionsByUserAndByDate(user.id, date, function (questions) {
            var text = 'Résumé pour l\'utilisateur : ' + user.name + ' à la date du ' + date +' \n';

            var msg = new Object();
            msg.text = text;
            msg.attachments = questionsToAttachments(questions, true);
            bot.sendPersonnalizedMessage(channel, msg, user.name, user.profile.image_48);
        });
    });
}

/**
 * Return array of attachment from array of questions
 *
 * @param {Array}   questions[]
 * @param {boolean} [json=false]
 *
 * @returns Array|string
 */
function questionsToAttachments(questions, json) {
    // Prepare attachments array
    var attachments = [];
    // For each question
    for(var i = 0; i < questions.length; i++) {
        var attachment = new Object();
        attachment.fallback = questions[i].value + '\n' + questions[i].answer;
        attachment.color = questions[i].color;
        attachment.title = questions[i].value;
        attachment.text = questions[i].answer;
        // To enable markdown in attachment (See https://api.slack.com/docs/message-formatting#message_formatting)
        attachment.mrkdwn_in = ['text', 'pretext'];

        attachments.push(attachment);
    }
    // Return the attachment array
    if (json === true) {
        return JSON.stringify(attachments);
    } else {
        return attachments;
    }
}

/**
 * Get bot informations
 */
function getBotImList(callback) {
    bot.getImList(function(response) {
        if(typeof callback === 'function') {
            callback(response.ims);
        }
    });
}