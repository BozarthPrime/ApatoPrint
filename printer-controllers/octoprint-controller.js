class octoprintController {
	constructor(settings, rest) {
		this.settings = settings;
		this.rest = rest;
		this.headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': this.settings.apiKey
		};
	}

	printerStatus(callback) {
		this.rest.get(
			this.settings.address, 
			this.settings.port, 
			"/api/printer?history=true&limit=2", 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, JSON.parse(data));
				} else {
					callback({
						message: "There was an error calling printerStatus",
						error: error
					});
				}
			}
		);
	};

	jobStatus(callback) {
		this.rest.get(
			this.settings.address, 
			this.settings.port, 
			"/api/job", 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, JSON.parse(data));
				} else {
					callback({
						message: "There was an error calling jobStatus",
						error: error
					});
				}
			}
		);
	};

	pause(callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/job", 
			'{"command": "pause", "action": "pause"}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling pause",
							error: error
						},
						false
					);
				}  
			}
		);
	};

	resume(callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/job", 
			'{"command": "pause", "action": "resume"}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling resume",
							error: error
						},
						false
					);
				}
			}
		);
	};

	cancel(callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/job", 
			'{"command": "cancel"}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling cancel",
							error: error
						},
						false
					);
				}
			}
		);
	};

	print(location, callback) {
		if (location.substring(0, 1) != "/") {
			location = "/" + location;
		}

		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/files" + location, 
			'{"command": "select", "print": true}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling cancel",
							error: error
						},
						false
					);
				}
			}
		);
	};

	getAllFiles(callback) {
		this.rest.get(
			this.settings.address, 
			this.settings.port, 
			"/api/files", 
			this.headers, 
			function(error, data) {
				if (error == null) {
					var result = JSON.parse(data);
					var toRet = [];

					for (var i = 0; i < result.files.length; i++) {
						if (result.files[i].type == "machinecode") {
							toRet.push(result.files[i]);
						}
					}

					callback(null, toRet);
				} else {
					callback({
						message: "There was an error calling getAllFiles",
						error: error
					});
				}
			}
		);
	};

	uploadFile(file, callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/files", 
			file, 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling cancel",
							error: error
						},
						false
					);
				}
			}
		);
	};

	connect(callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/connection", 
			'{"command": "connect"}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling connect",
							error: error
						},
						false
					);
				}
			}
		);
	};

	disconnect(callback) {
		this.rest.post(
			this.settings.address, 
			this.settings.port, 
			"/api/connection", 
			'{"command": "disconnect"}', 
			this.headers, 
			function(error, data) {
				if (error == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling disconnect",
							error: error
						},
						false
					);
				}
			}
		);
	};
}

module.exports = octoprintController;