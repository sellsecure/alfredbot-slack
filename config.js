var config = {};

config.slack = {};
config.slack.botName    = 'alfredbot';
config.slack.token      = 'your_bot_token';

config.schedule = {};
config.schedule.hour    = 09;
config.schedule.minute  = 30;

config.channel          = 'your_channel_name';

config.dbName           = 'alfredbot.db';

module.exports = config;
