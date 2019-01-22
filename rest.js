const https = require('https');
const settings = require('./settings.json');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = settings.rest.tlsRejectUnauthorized == true ? "1" : "0";

exports.post = function(host, port, path, data, headers, callback) {
	makeReq('POST', host, port, path, headers, callback, function(req) {
		req.write(data);
		req.end();
	});
};

exports.postForm = function(host, path, formData, callback) {
	request.post({
		url: host + path,
		formData: formData,
	}, function (err, response) {
		callback(err, response);
	});
}

exports.put = function(host, port, path, data, headers, callback) {
	makeReq('PUT', host, port, path, data, headers, callback, function(req) {
		req.write(data);
		req.end();
	});
};

exports.get = function(host, port, path, headers, callback) {
	makeReq('PUT', host, port, path, headers, callback, function(req) {
		req.end();
	});
};

exports.delete = function(host, port, path, headers, callback) {
	makeReq('DELETE', host, port, path, headers, callback, function(req) {
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
				{ 
					message: "Received bad status code", 
					error: { statusCode: res.statusCode }
				}
			);
		} else {
			res.setEncoding('utf8');
			var body = "";

			res.on('data', (d) => {
				body += d;
			});

			res.on("end", () => {
				requestCallback(null, body);
			});
		}
	});

	req.on('error', function(error) {
		requestCallback({
			message: "Error on req",
			error: error
		});
	});

	callback(req);
};
