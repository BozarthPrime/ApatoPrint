const SlackBot = require('slackbots');
const settings = require('./settings.json');
const octo = require('./octoprint-adapter');
const request = require('request');
const fs = require('fs');

const bot = new SlackBot({
    token: settings.slack.token
});

const params = {
    icon_emoji: settings.slack.iconEmoji
};

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
        settings.slack.connectionMessage != undefined ? settings.slack.connectionMessage : "I am now online!",
        params
    ).fail(function(data) {
        console.log("There was an error posting connection message. error=" + data.error);
    });
});

bot.on("message", function(data) {
    if (data.type == "message" && data.channel == settings.slack.commandChannelId) {
        if (data.text != undefined && data.text != null) {
            var commandParts = data.text.split(" ");

            if (commands[commandParts[0].toLowerCase()] != undefined) {
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

    bot.postMessageToGroup(
        settings.slack.commandChannelName,
        msg,
        params
    );
}

function pause() {
    octo.pause(function(res) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Print pause was " + (res == true ? "successful" : "unsuccessful"),
            params
        );
    });
}

function resume() {
    octo.resume(function(res) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Print resume was " + (res == true ? "successful" : "unsuccessful"),
            params
        );
    });
}

function cancel() {
    octo.cancel(function(res) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Print cancel was " + (res == true ? "successful" : "unsuccessful"),
            params
        );
    });
}

function connect() {
    octo.connect(function(res) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Printer connection was " + (res == true ? "successful" : "unsuccessful"),
            params
        );
    });
}

function disconnect() {
    octo.disconnect(function(res) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Printer disconnect was " + (res == true ? "successful" : "unsuccessful"),
            params
        );
    });
}

function jobStatus() {
    octo.jobStatus(function(data) {
        var result = "There was an error getting the status";

        if (data != null) {
            var result =
                "File name: " + data.job.file.name +
                "\nPrint time: " + data.progress.printTime +
                "\nPrint time left: " + data.progress.printTimeLeft +
                "\nPercent complete: " + (data.progress.completion != null ? data.progress.completion.toFixed(2) : 0) + "%";
        }

        uploadStatusPicture();
        bot.postMessageToGroup(settings.slack.commandChannelName, result, params);
    });
}

function printerStatus() {
    octo.printerStatus(function(data) {
        var result = "There was an error getting the status";

        if (data != null) {
            var result =
                "State: " + data.state.text +
                "\nBed temp: " + data.temperature.bed.actual +
                "\nTool0: " + data.temperature.tool0.actual;
        }

        bot.postMessageToGroup(settings.slack.commandChannelName, result, params);
    });
}

function getAllFiles() {
    octo.getAllFiles(function(data) {
        var result = "There was an error getting the files";

        if (data != null) {
            var result = "Files: \n";

            for (var i = 0; i < data.length; i++) {
                result += "\t" + data[i].refs.resource.split("files")[1] + "\n";
            }
        }

        bot.postMessageToGroup(settings.slack.commandChannelName, result, params);
    });
}

function print(args) {
    if (args.length == 0) {
        bot.postMessageToGroup(
            settings.slack.commandChannelName,
            "Invalid use of the print command. You must supply a file path.",
            params
        );
    } else {
        octo.print(args[0], function(res) {
            bot.postMessageToGroup(
                settings.slack.commandChannelName,
                (res == true ? "Starting print" : "Could not start print"),
                params
            );
        });
    }
}

function uploadStatusPicture() {
    fs.readdir(settings.octoprint.timelapseLocation, (err, files) => {
        if (files.length > 0) {
            var picture = null;

            for (var i = 0; i < files.length; i++) {
                var nameParts = files[i].split('-');
                var fileNumber = parseInt(nameParts[nameParts.length - 1], 10);

                if (picture == null || fileNumber > picture.fileNum) {
                    picture = {
                        fileName: files[i],
                        fileNum: fileNumber
                    };
                }
            }

            request.post({
                url: 'https://slack.com/api/files.upload',
                formData: {
                    token: settings.slack.token,
                    title: picture.fileName,
                    filename: picture.fileName,
                    filetype: "auto",
                    channels: settings.slack.commandChannelId,
                    file: fs.createReadStream(settings.octoprint.timelapseLocation + "/" + picture.fileName),
                },
            }, function (err, response) {
                if (err != null) {
                    console.log("Error in uploadStatusPicture: " + JSON.stringify(err));
                }
            });
        } else {
            bot.postMessageToGroup(
                settings.slack.commandChannelName,
                "There was no timelapse in progress",
                params
            );
        }
    });
}
