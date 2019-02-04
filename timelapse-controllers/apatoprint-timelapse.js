const fs = require('fs');
const PiCamera = require('pi-camera');
const timelapseState = {
	inTimelapse: false,
	timelapseStartTime: null,
	curTimelapseFolder: null,
	timelapseImageNum: 0
};

class apatoprintTimelapse {
	constructor(settings) {
		this.settings = settings;
		this.tempPhotoPath = `${ __dirname }/timelapse_tmp.jpg`;
		this.camera = new PiCamera({
			mode: 'photo',
			output: this.tempPhotoPath,
			width: settings.imageHeight,
			height: settings.imageWidth,
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

		timelapseState.curTimelapseFolder = settings.timelapseLocation + "timelapse_" + timestamp +"/";
		
		fs.mkdirSync(timelapseState.curTimelapseFolder);

		callback(
			{ message: "Starting a timelapse is unsupported when using Octoprint for timelapses" }
		);
	}
	
	stopTimelapse(callback) {
		callback(
			{ message: "Stopping a timelapse is unsupported when using Octoprint for timelapses" }
		);
	}

	timelapseLoop(timeout) {
		if (timelapseState.inTimelapse) {
			this.camera.snap()
				.then((result) => {
					fs.rename(this.tempPhotoPath, timelapseState.curTimelapseFolder + timelapseState.timelapseImageNum + ".jpg", function (err) {
						if (err) {
							console.log("There was an error moveing the timelapse photo: \n" + err.message);
						} else {
							console.log("Timelapse photo taken");
							timelapseState.timelapseImageNum++;
						}
					})
				})
				.catch((error) => {
					console.log("There was an error capturing the timelapse photo:\n" + error);
				});

			setTimeout(timelapseLoop, timeout);
		}
	}
	
	getImage(callback) {
		this.camera.snap()
			.then((result) => {
				callback(
					null,
					this.tempPhotoPath
				);
			})
			.catch((error) => {
				callback(
					{ message: "There was an error capturing the photo: \n>>> " + error }
				);
			});
	}
}

module.exports = apatoprintTimelapse;