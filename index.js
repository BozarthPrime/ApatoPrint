const settings = require('./settings_dev.json');
const rest = require('./rest');

//const CommandHandler = require('./command-handler');
const SlackBot = require('slackbots');
const PrinterController = require('./printer-controllers/octoprint-controller');
const TimelapseController = settings.timelapse.useOctoPrint ? 
	require('./timelapse-controllers/octoprint-timelapse') : 
	require('./timelapse-controllers/apatoprint-timelapse');

const printCtrl = new PrinterController(settings.octoprint, rest)
const timelapse = new TimelapseController(settings.timelapse);
const bot = new SlackBot({ token: settings.slack.token });

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
	disconnect: { command: disconnect, description: "Disconnect the printer" }
}

bot.on("start", function() {
	console.log("Connection to Slack established. Posting conformation message to command channel.");

	bot.postMessageToGroup(
		settings.slack.commandChannelName,
		settings.slack.connectionMessage != undefined ? 
			settings.slack.connectionMessage : "I am now online!",
		{ icon_emoji: settings.slack.iconEmoji }
	).fail(function(data) {
		console.log("There was an error posting connection message. error=" + data.error);
	});
});

bot.on("message", function(data){
	if (data.type == "message" && data.channel == settings.slack.commandChannelId) {
		if (data.subtype != 'bot_message' && data.text != undefined && data.text != null) {
			var commandParts = data.text.split(" ");

			if (commands[commandParts[0].toLowerCase()] != undefined) {
				console.log("Reviced command: " + data.text);
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
		postToCommandChannel(
			"Print pause was " + (res == true ? "successful" : "unsuccessful")
		);
	});
}

function resume() {
	printCtrl.resume(function(err, res) {
		postToCommandChannel(
			"Print resume was " + (res == true ? "successful" : "unsuccessful")
		);
	});
}

function cancel() {
	printCtrl.cancel(function(err, res) {
		postToCommandChannel(
			"Print cancel was " + (res == true ? "successful" : "unsuccessful")
		);
	});
}

function connect() {
	printCtrl.connect(function(err, res) {
		postToCommandChannel(
			"Printer connection was " + (res == true ? "successful" : "unsuccessful")
		);
	});
}

function disconnect() {
	printCtrl.disconnect(function(err, res) {
		postToCommandChannel(
			"Printer disconnect was " + (res == true ? "successful" : "unsuccessful")
		);
	});
}

function jobStatus() {
	printCtrl.jobStatus(function(err, data) {
		var result = "There was an error getting the status";

		if (err == null) {
			result =
				"File name: " + data.job.file.name +
				"\nPrint time: " + data.progress.printTime +
				"\nPrint time left: " + data.progress.printTimeLeft +
				"\nPercent complete: " + (data.progress.completion != null ? data.progress.completion.toFixed(2) : 0) + "%";

			uploadStatusPicture();
		} 

		postToCommandChannel(result);
	});
}

function printerStatus() {
	printCtrl.printerStatus(function(err, data) {
		var result = "There was an error getting the status";

		if (err == null) {
			result =
				"State: " + data.state.text +
				"\nBed temp: " + data.temperature.bed.actual +
				"\nTool0: " + data.temperature.tool0.actual;
		}

		postToCommandChannel(result);
	});
}

function getAllFiles() {
	printCtrl.getAllFiles(function(err, data) {
		var result = "There was an error getting the files";

		if (err == null) {
			var result = "Files: \n";

			for (var i = 0; i < data.length; i++) {
				result += "\t" + data[i].refs.resource.split("files")[1] + "\n";
			}
		}

		postToCommandChannel(result);
	});
}

function print(args) {
	if (args.length == 0) {
		postToCommandChannel("Invalid use of the print command. You must supply a file path.");
	} else {
		printCtrl.print(args[0], function(err, res) {
			postToCommandChannel(
				(res == true ? "Starting print" : "Could not start print")
			);
		});
	}
}

function uploadStatusPicture() {
	timelapse.getLatestImage(function(err, imageName, imagePath) {
		if (err == null) {
			rest.postForm(
				'https://slack.com', 
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
						console.log("Error in uploadStatusPicture: " + JSON.stringify(err));
						postToCommandChannel(
							"Slack file upload failed: \n>>>" + JSON.stringify(err)
						);
					}
				}
			);
		} else {
			postToCommandChannel("Issue getting status picture: \n>>>" + err.error);
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