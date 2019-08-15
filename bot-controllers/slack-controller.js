const SlackBot = require('slackbots');
const RestHandler = require('./rest-handler');
const slackRest = new RestHandler('https://slack.com', "", true);
const log = require("../logger");

class slackController {
	constructor(settings, messageHandler) {
		this.settings = settings;
        this.messageHandler = messageHandler;
        this.bot = new SlackBot({ token: settings.token });

        this.bot.on("start", onStart(this.settings));

        this.bot.on("message", function(data){
            
            if (data.type == "message" && data.channel == this.settings.commandChannelId) {
                if (data.subtype != 'bot_message' && data.text != undefined && data.text != null) {
                    this.messageHandler(data);
                }
            }
        });
    }

    onStart(settings) {
        log.info("Connection to Slack established. Posting conformation message to command channel.");
        
        bot.postMessageToGroup(
            settings.commandChannelName,
            settings.connectionMessage != undefined ? 
                settings.connectionMessage : "I am now online!",
            { icon_emoji: settings.iconEmoji }
        ).fail(function(data) {
            log.error("There was an error posting connection message. error=" + data.error);
        });
    }
    
    

	printerStatus(callback) {
		this.rest.get(
			"/api/printer?history=true&limit=2", 
			this.headers, 
			function(err, data) {
				if (err == null) {
					callback(null, JSON.parse(data));
				} else {
					callback({
						message: "There was an error calling printerStatus",
						error: err
					});
				}
			}
		);
	};
}

module.exports = slackController;