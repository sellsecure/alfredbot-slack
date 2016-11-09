# Alfred bot for Slack By SELL secure


## What is it doing ?
Alfred check all users in a channel (see config part) to send them some questions to do a report. Alfred send it every at the same time and respect the timezone of the user.


## How to config Alfred ?
Open config.js at the root path, and update these settings with your own data :
>config.slack.botName    = 'alfredbot';
>
>config.slack.token      = 'your_bot_token'; // Here put the token api of your bot in slack
>
>config.schedule.hour    = 09; // Hour to schedule the submission of the report
>
>config.schedule.minute  = 30; // Minutes to schedule the submission of the report
>
>config.channel          = 'your_channel_name'; // Name of the channel where Alfred picks its user list (every hour)
>
>config.dbName           = 'alfredbot.db'; // Name of the SQLite DB, stored in the data folder of Alfredbot


## First Launch
At the first launch, exec :
>npm start

this command will check if the database exists, if not it will create it.


## How to do a daemon with this script
-> Read README in daemonize folder


## TODO
- list question with command line
- edit question with command line
- add question with command line
- remove question with command line
- internationalize the bot (some text are hardcoded in french...)
