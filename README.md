# Alfred bot for Slack By SELL secure


## What is it doing ?
Alfred check all user in a channel (see config part) to send them some question to do a report. And Alfred respect the timezone of the user.


## How to config Alfred ?
Open config.js as root path, and update this param with your own data :
>config.slack.botName    = 'alfredbot';
>
>config.slack.token      = 'your_bot_token'; // Here put the token api of your bot in slack
>
>config.schedule.hour    = 09; // Hour to schedule asking for report
>
>config.schedule.minute  = 30; // Minutes to schedule asking for report
>
>config.channel          = 'your_channel_name'; // Name of the channel where Alfred fo to pick his user list (every hour)
>
>config.dbName           = 'alfredbot.db'; // Name of the SQLite DB, store in the data folder of Alfredbot


## First Launch
At the first launch, exec :
>npm start

this command will check if the database exist, if not it will create it.


## How to do a daemon with this script
-> Read README in daemonize folder


## TODO
- list question with command line
- edit question with command line
- add question with command line
- remove question with command line
