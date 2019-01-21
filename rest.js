const https = require('https');
const settings = require('./settings.json');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = settings.rest.tlsRejectUnauthorized == true ? "1" : "0";

exports.post = function(host, port, path, data, headers, callback) {
	makeReq('POST', host, port, path, headers, callback, function(req) {
		req.write(data);
		req.end();
	});
};

exports.put = function(host, port, path, data, headers, callback) {
	makeReq('PUT', host, port, path, data, headers, callback, function(req) {
		req.write(data);
		req.end();
	});
};

exports.get = function(host, port, path, headers, callback) {
	makeReq('PUT', host, port, path, data, headers, callback, function(req) {
		req.end();
	});
};

exports.delete = function(host, port, path, headers, callback) {
	makeReq('DELETE', host, port, path, data, headers, callback, function(req) {
		req.end();
	});
};

function makeReq(method, host, port, path, headers, requestCallback, callback) {
	const options = {
		hostname: host,
		port: port,
		path: path,
		method: method,
		headers: headers
	};

	const req = https.request(options, function(res) {
		if (res.statusCode < 200 || res.statusCode > 299) {
			requestCallback(
				null, 
				{ 
					error: "Received bad status code", 
					statusCode: res.statusCode 
				}
			);
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

	callback(req);
};
