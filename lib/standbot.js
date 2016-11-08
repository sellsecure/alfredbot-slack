'use strict';

var util = require('util');
var fs = require('fs');
var Bot = require('slackbots');
var Slack = require('slack-node');
var WebSocket = require('ws');

var StandBot = function Constructor(settings) {
    this.settings = settings;

    this.user = null;
    this.server = null;

    this.slack = new Slack(settings.token);
};

// inherits methods and properties from the Bot constructor
util.inherits(StandBot, Bot);

module.exports = StandBot;

StandBot.prototype.run = function () {
    StandBot.super_.call(this, this.settings);
};

StandBot.prototype.getDetailUsersList = function (users, callback) {
    var listUsers = [];
    var self = this;

    this.slack.api("users.list", function(err, response) {
        for(var i = 0; i < response.members.length; i++) {
            if(response.members[i].name != self.settings.name) {
                for(var j = 0; j < users.length; j++) {
                    if(response.members[i].id == users[j]) {
                        listUsers.push(response.members[i]);
                    }
                }
            }
        }

        if(typeof callback === 'function') {
            callback(listUsers);
        }
    });
};

StandBot.prototype.getUsersIdList = function (users, callback) {
    this.slack.api("users.list", function(err, response) {
        for(var i=0; i<response.members.length; i++) {
            for(var j = 0; j < users.length; j++) {
                if(users[j].username == response.members[i].name) {
                    users[j].slack_id = response.members[i].id;
                    users[j].img = response.members[i].profile.image_48;
                }
            }
        }

        if(typeof callback === 'function') {
            callback(users);
        }
    });
};

StandBot.prototype.getUserInfo = function(id, callback){
    this.slack.api('users.info', {user: id}, function(err, response){
        if(err) {
            console.log(err);
        }
        if(typeof callback === 'function') {
            callback(response.user);
        }
    });
};

StandBot.prototype.getImList = function(callback)
{
    this.slack.api('im.list', function(err, response) {
        if(typeof callback === 'function') {
            callback(response);
        }
    });
};

StandBot.prototype.getImListForUser = function(users, callback)
{
    var self = this;

    this.slack.api('im.list', function(err, response) {
        for(var i = 0; i < users.length; i++) {
            users[i].im_id = null;
            for (var j = 0; j < response.ims.length; j++) {
                if (response.ims[j].user == users[i].id) {
                    users[i].im_id = response.ims[j].id;
                }
            }

            if(users[i].im_id == null) {
                self.openIM(users[i].id, function(imId) {
                    users[i].im_id = imId;
                });
            }
        }

        if(typeof callback === 'function') {
            callback(users);
        }
    });
};

StandBot.prototype.openIM = function(user_id, callback) {
    this.slack.api('im.open', {'user': user_id}, function(err, response) {
        if(typeof callback === 'function') {
            callback(response.channel.id);
        }
    });
};

StandBot.prototype.openRTM = function(callback)
{
    var self = this;
    this.slack.api('rtm.start', function(err, response) {
        self.server = new WebSocket(response.url);
        if(typeof callback === 'function') {
            callback(self.server);
        }
    });
};

StandBot.prototype.sendMessage = function(channel, message, callback)
{
    this.slack.api(
        'chat.postMessage',
        {
            channel: channel,
            text: message.text,
            attachments: message.attachments,
            as_user: true,
            link_names: 1
        },
        function(err, response) {
            if(err) {
                console.log(err);
            }
            if(typeof callback === 'function') {
                callback(response);
            }
        }
    );
};

StandBot.prototype.sendPersonnalizedMessage = function(channel, message, user_name, user_img, callback)
{
    this.slack.api(
        'chat.postMessage',
        {
            channel: channel,
            text: message.text,
            attachments: message.attachments,
            username: user_name,
            as_user: false,
            icon_url: user_img,
            link_names: 1
        },
        function(err, response) {
            if(err) {
                console.log(err);
            }
            if(typeof callback === 'function') {
                callback(response);
            }
        }
    );
};

StandBot.prototype.updateMessage = function(ts, channel, message, callback) {
    this.slack.api(
        'chat.update',
        {
            ts: ts,
            channel: channel,
            text: message.text,
            attachments: message.attachments,
            as_user: true,
            link_names: 1
        },
        function(err, response) {
            if(err) {
                console.log(err);
            }
            if(typeof callback === 'function') {
                callback(response);
            }
        }
    );
};

StandBot.prototype.getChannel = function(channel, callback) {
    this.slack.api('channels.list', function(err, response) {
        if(err) {
            console.log(err);
        }

        var idChannel = null;

        for(var i = 0; i < response.channels.length; i++) {
            if(response.channels[i].name == channel) {
                idChannel = response.channels[i].id;
            }
        }

        if(typeof callback === 'function') {
            callback(idChannel);
        }
    });
};

StandBot.prototype.getMembersChannel = function(channel, callback) {
    this.slack.api('channels.info', {channel: channel}, function(err, response) {
        if(err) {
            console.log(err);
        }
        if(typeof callback === 'function') {
            callback(response.channel.members);
        }
    });
};