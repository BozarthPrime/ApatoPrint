const https = require('https');
const settings = require('./settings.json');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = settings.rest.tlsRejectUnauthorized == true ? "1" : "0";

exports.post = function(path, data, headers, callback) {
    const options = {
        hostname: settings.rest.address,
        port: settings.rest.port,
        path: path,
        method: 'POST',
        headers: headers
    };

    const req = https.request(options, function(res) {
        if (res.statusCode < 200 || res.statusCode > 299) {
            callback(null, { error: "Received bad status code", statusCode: res.statusCode });
        } else {
            res.setEncoding('utf8');
            var body = "";

            res.on('data', (d) => {
                body += d;
            });

            res.on("end", () => {
                callback(body);
            });
        }
    });

    req.on('error', function(e) {
        console.log(e);
        callback(null, { error: "Error on req"});
    });

    req.write(data);
    req.end();
};

exports.get = function(path, headers, callback) {
    const options = {
        hostname: settings.rest.address,
        port: settings.rest.port,
        path: path,
        method: 'GET',
        headers: headers
    };

    const req = https.request(options, (res) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
            callback(null, { error: "Received bad status code", statusCode: res.statusCode });
        } else {
            res.setEncoding('utf8');
            var body = "";

            res.on('data', (d) => {
                body += d;
            });

            res.on("end", () => {
                callback(body);
            });
        }
    });

    req.on('error', function(e) {
        console.log(e);
        callback(null, { error: "Error on req"});
    });

    req.end();
};
