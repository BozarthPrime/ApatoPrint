const rest = require('./rest');
const settings = require('./settings.json');

const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': settings.octoprint.apiKey
};

exports.printerStatus = function(callback) {
    rest.get(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/printer?history=true&limit=2", 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling printerStatus: " + JSON.stringify(error));
                callback(null);
            } else {
                callback(JSON.parse(data));
            }
        }
    );
};

exports.jobStatus = function(callback) {
    rest.get(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/job", 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling jobStatus: " + JSON.stringify(error));
                callback(null);
            } else {
                callback(JSON.parse(data));
            }
        }
    );
};

exports.pause = function(callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/job", 
        '{"command": "pause", "action": "pause"}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling pause: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }  
        }
    );
};

exports.resume = function(callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/job", 
        '{"command": "pause", "action": "resume"}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling resume: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};

exports.cancel = function(callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/job", 
        '{"command": "cancel"}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling cancel: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};

exports.print = function(location, callback) {
    if (location.substring(0, 1) != "/") {
        location = "/" + location;
    }

    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/files" + location, 
        '{"command": "select", "print": true}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling cancel: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};

exports.getAllFiles = function(callback) {
    rest.get(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/files", 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling getAllFiles: " + JSON.stringify(error));
                callback(null);
            } else {
                console.log(data);
                var result = JSON.parse(data);
                var toRet = [];

                for (var i = 0; i < result.files.length; i++) {
                    if (result.files[i].type == "machinecode") {
                        toRet.push(result.files[i]);
                    }
                }

                callback(toRet);
            }
        }
    );
};

exports.uploadFile = function(file, callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/files", 
        file, 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling cancel: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};

exports.connect = function(callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/connection", 
        '{"command": "connect"}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling connect: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};

exports.disconnect = function(callback) {
    rest.post(
        settings.octoprint.address, 
        settings.octoprint.port, 
        "/api/connection", 
        '{"command": "disconnect"}', 
        headers, 
        function(data, error) {
            if (error != null) {
                console.log("There was an error calling disconnect: " + JSON.stringify(error));
                callback(false);
            } else {
                callback(true);
            }
        }
    );
};
