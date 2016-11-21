var moment    = require('moment-timezone');
var logDir    = 'logs/alfred_' + moment().format('YYYY-MM-DD_HH-mm-SSS') + '.log';
var fs        = require('fs');
var Log       = require('log');
var log       = new Log('info', fs.createWriteStream(logDir));

/*
var logReader = new Log('info', fs.createReadStream(logDir));

logReader.on('line', function(line){
    console.log(line);
});
*/

module.exports = log;