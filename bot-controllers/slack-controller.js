const SlackBot = require('slackbots');
const RestHandler = require('../rest-handler');
const slackRest = new RestHandler('https://slack.com', "", true);
const log = require("../logger");
const state = {};

class slackController {
	constructor(settings, messageHandler) {
		state.bot = new SlackBot({ token: settings.token });
		state.settings = settings;
		state.messageHandler = messageHandler;

        state.bot.on("start", function() {
			log.info("Connection to Slack established. Posting conformation message to command channel.");
			
			state.bot.postMessageToGroup(
				state.settings.commandChannelName,
				state.settings.connectionMessage != undefined ? 
				state.settings.connectionMessage : "I am now online!",
				{ icon_emoji: state.settings.iconEmoji }
			).fail(function(data) {
				log.error("There was an error posting connection message. error=" + data.error);
			});
		});

        state.bot.on("message", function(data){
			if (data != undefined && data != null) {
				if (data.type == "message" && data.channel == state.settings.commandChannelId) {
					if (data.subtype != 'bot_message' && data.text != undefined && data.text != null) {
						state.messageHandler(data.text);
					}
				}
			}
        });
	}
	
	postToCommandChannel(message) {
		state.bot.postMessageToGroup(
			state.settings.commandChannelName,
			message,
			{ icon_emoji: state.settings.iconEmoji }
		);
	}

	uploadFile(imageName, imagePath) {
		slackRest.postForm( 
			'/api/files.upload', 
			{
				token: state.settings.token,
				title: imageName,
				filename: imageName,
				filetype: "auto",
				channels: state.settings.commandChannelId,
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
	}
}

module.exports = slackController;