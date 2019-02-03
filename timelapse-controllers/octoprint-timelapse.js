const fs = require('fs');

class octoprintTimelapse {
	constructor(settings) {
		this.settings = settings;
	}

	startTimelapse(callback) {
		callback(
			{ message: "Starting a timelapse is unsupported when using Octoprint for timelapses" }
		);
	}
	
	stopTimelapse(callback) {
		callback(
			{ message: "Stopping a timelapse is unsupported when using Octoprint for timelapses" }
		);
	}
	
	getLatestImage(callback) {
		fs.readdir(this.settings.timelapseLocation, function(err, files) {
			if (files != undefined && files != null && files.length > 0) {
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
	
				callback(
					null,
					picture.fileName,
					this.settings.timelapseLocation + "/" + picture.fileName
				);
			} else {
				callback(
					{ message: "Octoprint does not currently have a timelapse running" }
				)
			}
		});
	}
}

module.exports = octoprintTimelapse;

