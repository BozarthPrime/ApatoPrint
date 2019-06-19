const settings = require('./settings.json');
const fs = require('fs');
const log = require("./logger");

const RestHandler = require('./rest-handler');
const SlackBot = require('slackbots');
const PrinterController = require('./printer-controllers/octoprint-controller');
const TimelapseController = settings.timelapse.useOctoPrint ? 
	require('./timelapse-controllers/octoprint-timelapse') : 
	require('./timelapse-controllers/apatoprint-timelapse');


const printCtrl = new PrinterController(settings.octoprint, new RestHandler(settings.octoprint.address, settings.octoprint.port, false));
const timelapse = new TimelapseController(settings.timelapse);
const bot = new SlackBot({ token: settings.slack.token });
const slackRest = new RestHandler('https://slack.com', "", true);

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

bot.on("start", function() {
	log.info("Connection to Slack established. Posting conformation message to command channel.");

	bot.postMessageToGroup(
		settings.slack.commandChannelName,
		settings.slack.connectionMessage != undefined ? 
			settings.slack.connectionMessage : "I am now online!",
		{ icon_emoji: settings.slack.iconEmoji }
	).fail(function(data) {
		log.error("There was an error posting connection message. error=" + data.error);
	});
});

bot.on("message", function(data){
	if (data.type == "message" && data.channel == settings.slack.commandChannelId) {
		if (data.subtype != 'bot_message' && data.text != undefined && data.text != null) {
			var commandParts = data.text.split(" ");

			if (commands[commandParts[0].toLowerCase()] != undefined) {
				log.debug("Reviced command: " + data.text);
				commands[commandParts[0].toLowerCase()].command(commandParts.slice(1));
			}
		}
	}
});

function help() {
	var msg = "Commands:\n";

	Object.keys(commands).forEach(function(key,index) {
		if (commands.hasOwnProperty(key)) {
			msg += "\t" + key + " - " + commands[key].description + "\n";
		}
	});

	postToCommandChannel(msg);
}

function pause() {
	printCtrl.pause(function(err, res) {
		if (err) {
			log.error("Error in pause:" + JSON.stringify(err));
		}

		postToCommandChannel(
			"Print pause was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function resume() {
	printCtrl.resume(function(err, res) {
		if (err) {
			log.error("Error in resume:" + JSON.stringify(err));
		}

		postToCommandChannel(
			"Print resume was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function cancel() {
	printCtrl.cancel(function(err, res) {
		if (err) {
			log.error("Error in cancel:" + JSON.stringify(err));
		}

		postToCommandChannel(
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

		postToCommandChannel(
			"Printer connection was " + (res == true ? "successful" : "unsuccessful: \n>>>" + err.message)
		);
	});
}

function disconnect() {
	printCtrl.disconnect(function(err, res) {
		if (err) {
			log.error("Error in disconnect:" + JSON.stringify(err));
		}

		postToCommandChannel(
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

		postToCommandChannel(result);
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

		postToCommandChannel(result);
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

		postToCommandChannel(result);
	});
}

function print(args) {
	if (args.length == 0) {
		postToCommandChannel("Invalid use of the print command. You must supply a file path.");
	} else {
		printCtrl.print(args[0], function(err, res) {
			if (err) {
				log.error("Error in print:" + JSON.stringify(err));
			}

			postToCommandChannel(
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
			slackRest.postForm( 
				'/api/files.upload', 
				{
					token: settings.slack.token,
					title: imageName,
					filename: imageName,
					filetype: "auto",
					channels: settings.slack.commandChannelId,
					file: fs.createReadStream(imagePath),
				}, 
				function (err, response) {
					if (err != null) {
						log.error("Error in uploadStatusPicture:" + JSON.stringify(err));
						
						postToCommandChannel(
							"Slack file upload failed: \n>>>" + err.message
						);
					}
				}
			);
		} else {
			postToCommandChannel("Issue getting status picture: \n>>>" + err.message);
		}
	});
}

function startTimelapse() {
	timelapse.startTimelapse(function(err, result) {
		if (err == null) {
			postToCommandChannel("Timelapse started");
		} else {
			postToCommandChannel("Issue starting timelapse: \n>>>" + err.message);
		}
	});
}

function stopTimelapse() {
	timelapse.stopTimelapse(function(err, result) {
		if (err == null) {
			postToCommandChannel("Timelapse stopped");
		} else {
			postToCommandChannel("Issue stopping timelapse: \n>>>" + err.message);
		}
	});
}

function postToCommandChannel(message) {
	bot.postMessageToGroup(
		settings.slack.commandChannelName,
		message,
		{ icon_emoji: settings.slack.iconEmoji }
	);
}