const settings = require('./settings.json');
const fs = require('fs');
const log = require("./logger");

const RestHandler = require('./rest-handler');
const BotController = require('./bot-controllers/slack-controller');
const PrinterController = require('./printer-controllers/octoprint-controller');
const TimelapseController = settings.timelapse.useOctoPrint ? 
	require('./timelapse-controllers/octoprint-timelapse') : 
	require('./timelapse-controllers/apatoprint-timelapse');


const printCtrl = new PrinterController(settings.octoprint, new RestHandler(settings.octoprint.address, settings.octoprint.port, false));
const timelapse = new TimelapseController(settings.timelapse);
const bot = new BotController(settings.slack, handleMessage);

const commands = {
	help: { command: help, description: "Print all commands" },
	print: { command: print, description: "Print a specified file" },
	pause: { command: pause, description: "Pause a running print" },
	resume: { command: resume, description: "Resume a running print" },
	cancel: { command: cancel, description: "Cancel the running print" },
	jobstatus: { command: jobStatus, description: "Get the status of the current job" },
	jobpicture: { command: uploadStatusPicture, description: "Get a picture of the current job" },
	printerstatus: { command: printerStatus, description: "Get the status of the printer" },
	getallfiles: { command: getAllFiles, description: "Display all the files on the server" },
	connect: { command: connect, description: "Connect to a printer" },
	disconnect: { command: disconnect, description: "Disconnect the printer" },
	starttimelapse: { command: startTimelapse, description: "Start a new timelapse" },
	stoptimelapse: { command: stopTimelapse, description: "Stop a timelapse if one is running" }
}

function handleMessage(message) {
	log.debug("handleMessage: " + message);
	
	if (message != undefined && message != null) {
		var commandParts = message.split(" ");

		if (commands[commandParts[0].toLowerCase()] != undefined) {
			commands[commandParts[0].toLowerCase()].command(commandParts.slice(1));
		}
	}
}

function help() {
	var msg = "Commands:\n";

	Object.keys(commands).forEach(function(key,index) {
		if (commands.hasOwnProperty(key)) {
			msg += "\t" + key + " - " + commands[key].description + "\n";
		}
	});

	bot.postToCommandChannel(msg);
}

function pause() {
	printCtrl.pause(function(err, res) {
		if (err) {
			log.error("Error in pause:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(
			"Print pause was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function resume() {
	printCtrl.resume(function(err, res) {
		if (err) {
			log.error("Error in resume:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(
			"Print resume was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function cancel() {
	printCtrl.cancel(function(err, res) {
		if (err) {
			log.error("Error in cancel:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(
			"Print cancel was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
		
		if (res == true && settings.timelapse.autoStartTimelapseWithJobs) {
			stopTimelapse();
		}
	});
}

function connect() {
	printCtrl.connect(function(err, res) {
		if (err) {
			log.error("Error in connect:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(
			"Printer connection was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function disconnect() {
	printCtrl.disconnect(function(err, res) {
		if (err) {
			log.error("Error in disconnect:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(
			"Printer disconnect was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function jobStatus() {
	printCtrl.jobStatus(function(err, data) {
		var result = "There was an error getting the status";

		if (err == null) {
			if (data.job.file.name != null) {
				result =
					"File name: " + data.job.file.name +
					"\nPrint time: " + data.progress.printTime +
					"\nPrint time left: " + data.progress.printTimeLeft +
					"\nPercent complete: " + (data.progress.completion != null ? data.progress.completion.toFixed(2) : 0) + "%";

				uploadStatusPicture();
			} else {
				result = "There is currently no job running";
			}
		} else {
			result = "There was an error getting the status: \n>>>" + err.message;
			log.error("Error in jobStatus:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(result);
	});
}

function printerStatus() {
	printCtrl.printerStatus(function(err, data) {
		var result;

		if (err == null) {
			result =
				"State: " + data.state.text +
				"\nBed temp: " + data.temperature.bed.actual +
				"\nTool0: " + data.temperature.tool0.actual;
		} else {
			result = "There was an error getting the status: \n>>>" + err.message;
			log.error("Error in printerStatus:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(result);
	});
}

function getAllFiles() {
	printCtrl.getAllFiles(function(err, data) {
		var result;

		if (err == null) {
			result = "Files: \n";

			for (var i = 0; i < data.length; i++) {
				result += "\t" + data[i].refs.resource.split("files")[1] + "\n";
			}
		} else {
			result = "There was an error getting the files: \n>>>" + err.message;
			log.error("Error in getAllFiles:" + JSON.stringify(err));
		}

		bot.postToCommandChannel(result);
	});
}

function print(args) {
	if (args.length == 0) {
		bot.postToCommandChannel("Invalid use of the print command. You must supply a file path.");
	} else {
		printCtrl.print(args[0], function(err, res) {
			if (err) {
				log.error("Error in print:" + JSON.stringify(err));
			}

			bot.postToCommandChannel(
				(res == true ? "Starting print" : "Could not start print \n>>>" + err.message)
			);

			if (res == true && settings.timelapse.autoStartTimelapseWithJobs) {
				startTimelapse();
			}
		});
	}
}

function uploadStatusPicture() {
	timelapse.getImage(function(err, imageName, imagePath) {
		if (err == null) {
			bot.uploadFile(imageName, imagePath);
		} else {
			bot.postToCommandChannel("Issue getting status picture: \n>>>" + err.message);
		}
	});
}

function startTimelapse() {
	timelapse.startTimelapse(function(err, result) {
		if (err == null) {
			bot.postToCommandChannel("Timelapse started");
		} else {
			bot.postToCommandChannel("Issue starting timelapse: \n>>>" + err.message);
		}
	});
}

function stopTimelapse() {
	timelapse.stopTimelapse(function(err, result) {
		if (err == null) {
			bot.postToCommandChannel("Timelapse stopped");
		} else {
			bot.postToCommandChannel("Issue stopping timelapse: \n>>>" + err.message);
		}
	});
}