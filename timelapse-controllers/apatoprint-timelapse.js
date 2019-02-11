const fs = require('fs');
const PiCamera = require('pi-camera');
const tempPhotoPath = `${ __dirname }/timelapse_tmp.jpg`;
const timelapseState = {
	inTimelapse: false,
	stopTimelapse: false,
	timelapseStartTime: null,
	curTimelapseFolder: null,
	timelapseImageNum: 0
};

class apatoprintTimelapse {
	constructor(settings) {
		this.settings = settings;
		this.camera = new PiCamera({
			mode: 'photo',
			output: tempPhotoPath,
			width: settings.imageWidth,
			height: settings.imageHeight,
			nopreview: true
		});

		// Make sure the folder name is terminated with a slash
		if (settings.timelapseLocation.charAt(settings.timelapseLocation.length - 1) != "/") {
			settings.timelapseLocation += "/";
		}

		if (!fs.existsSync(settings.timelapseLocation)) {
			fs.mkdirSync(settings.timelapseLocation);
		}
	}

	startTimelapse(callback) {
		var timestamp = new Date().getTime();
		timelapseState.inTimelapse = true;
		timelapseState.stopTimelapse = false;
		timelapseState.timelapseStartTime = timestamp;
		timelapseState.curTimelapseFolder = this.settings.timelapseLocation + "timelapse_" + timestamp + "/";
		timelapseState.timelapseImageNum = 0;

		fs.mkdirSync(timelapseState.curTimelapseFolder);
		this.timelapseLoop(this);

		callback(
			null,
			true
		);
	}
	
	stopTimelapse(callback) {
		timelapseState.stopTimelapse = true;

		callback(
			null,
			true
		);
	}

	timelapseLoop(context) {
		if (timelapseState.stopTimelapse) {
			if (timelapseState.timelapseImageNum < context.settings.maxImagesPerTimelapse) {
				context.camera.snap()
					.then((result) => {
						console.log(result);
						fs.rename(tempPhotoPath, timelapseState.curTimelapseFolder + timelapseState.timelapseImageNum + ".jpg", function (err) {
							if (err) {
								console.log("There was an error moveing the timelapse photo: \n" + err.message);
							} else {
								timelapseState.timelapseImageNum++;
								console.log("Timelapse photo taken: " + timelapseState.timelapseImageNum);
							}

							setTimeout(context.timelapseLoop.bind(null, context), context.settings.intervalMS);
						})
					})
					.catch((error) => {
						console.log("There was an error capturing the timelapse photo:\n" + error);
						setTimeout(context.timelapseLoop.bind(null, context), context.settings.intervalSeconds * 1000);
					});
			} else {
				this.stopTimelapse(function() {
					console.log("Stopped timelapse because image limit was reached");
				});
			}
		} else {
			timelapseState.stopTimelapse = false;
			timelapseState.inTimelapse = false;
		}
	}
	
	getImage(callback) {
		if (timelapseState.inTimelapse) {
			fs.readdir(timelapseState.curTimelapseFolder, function(err, files) {
				if (files != undefined && files != null && files.length > 0) {
					callback(
						null,
						files[files.length - 1],
						timelapseState.curTimelapseFolder + files[files.length - 1]
					);
				} else {
					callback(
						{ message: "No timelapse pictures were made yet" }
					)
				}
			});
		} else {
			this.camera.snap()
			.then((result) => {
				callback(
					null,
					"Current Printer Status",
					tempPhotoPath
				);
			})
			.catch((error) => {
				callback(
					{ message: "There was an error capturing the photo: \n>>> " + error }
				);
			});
		}
		
	}
}

module.exports = apatoprintTimelapse;