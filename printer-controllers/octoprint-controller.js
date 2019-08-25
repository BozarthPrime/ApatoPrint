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

	jobStatus(callback) {
		this.rest.get(
			"/api/job", 
			this.headers, 
			function(err, data) {
				if (err == null) {
					callback(null, JSON.parse(data));
				} else {
					callback({
						message: "There was an error calling jobStatus",
						error: err
					});
				}
			}
		);
	};

	pause(callback) {
		var data = '{"command": "pause", "action": "pause"}';
		this.rest.post(
			"/api/job", 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling pause",
							error: err
						},
						false
					);
				}  
			}
		);
	};

	resume(callback) {
		var data = '{"command": "pause", "action": "resume"}';
		this.rest.post(
			"/api/job", 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling resume",
							error: err
						},
						false
					);
				}
			}
		);
	};

	cancel(callback) {
		var data = '{"command": "cancel"}';
		this.rest.post(
			"/api/job", 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling cancel",
							error: err
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
		var data = '{"command": "select", "print": true}';

		this.rest.post(
			"/api/files" + location, 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling print",
							error: err
						},
						false
					);
				}
			}
		);
	};

	getAllFiles(callback) {
		this.rest.get(
			"/api/files", 
			this.headers, 
			function(err, data) {
				if (err == null) {
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
						error: err
					});
				}
			}
		);
	};

	uploadFile(file, callback) {
		this.rest.post(
			"/api/files", 
			file, 
			this.headers, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling uploadFile",
							error: err
						},
						false
					);
				}
			}
		);
	};

	connect(callback) {
		var data = '{"command": "connect"}';
		this.rest.post(
			"/api/connection", 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling connect",
							error: err
						},
						false
					);
				}
			}
		);
	};

	disconnect(callback) {
		var data = '{"command": "disconnect"}';
		this.rest.post(
			"/api/connection", 
			data, 
			{
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'X-Api-Key': this.settings.apiKey
			}, 
			function(err, data) {
				if (err == null) {
					callback(null, true);
				} else {
					callback(
						{
							message: "There was an error calling disconnect",
							error: err
						},
						false
					);
				}
			}
		);
	};
}

module.exports = octoprintController;