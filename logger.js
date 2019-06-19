const settings = require('./settings.json');
const fs = require("fs");
const logLevels = {
	VERBOSE: 0,
	DEBUG: 1,
	INFO: 2,
	ERROR: 3,
	WARNING: 4
}
const currentLogLevel = determineLogLevel(settings.log.level);
const logToConsole = settings.log.logToConsole == true;

function determineLogLevel(setting) {
	if (setting == null || setting == undefined) {
		return logLevels.INFO;
	}

	switch(setting.toLowerCase()) {
		case "verbose":
			return logLevels.VERBOSE;
		case "debug":
			return logLevels.DEBUG;
		case "info":
			return logLevels.INFO;
		case "error":
			return logLevels.ERROR;
		case "warning":
			return logLevels.WARNING;
		default:
			return logLevels.INFO;
	}
}

module.exports.verbose = function(msg) {
	log(logLevels.VERBOSE, msg);
}

module.exports.debug = function(msg) {
	log(logLevels.DEBUG, msg);
}

module.exports.info = function(msg) {
	log(logLevels.INFO, msg);
}

module.exports.error = function(msg) {
	log(logLevels.ERROR, msg);
}

module.exports.warn = function(msg) {
	log(logLevels.WARNING, msg);
}

function log(level, msg) {
	if (level >= currentLogLevel) {
		var d = new Date();
		var dateString =
			d.getUTCFullYear() + "-" +
			("0" + (d.getUTCMonth()+1)).slice(-2) + "-" +
			("0" + d.getUTCDate()).slice(-2) + " " +
			("0" + d.getUTCHours()).slice(-2) + ":" +
			("0" + d.getUTCMinutes()).slice(-2) + ":" +
			("0" + d.getUTCSeconds()).slice(-2);
		
		var outputMsg = "[" + dateString + "] " + msg;

		if (logToConsole) {
			console.log(outputMsg);
		}

		fs.appendFileSync('service.log', outputMsg + "\n");
	}
} 