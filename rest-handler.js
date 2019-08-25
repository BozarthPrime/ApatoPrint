const settings = require('./settings.json');
const http = require('http');
const https = require('https');
const request = require('request');
const log = require("./logger");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = settings.rest.tlsRejectUnauthorized == true ? "1" : "0";

class restHandler {
	constructor(host, port, useHttps) {
		this.host = host;
		this.port = port;
		this.httpMethod = useHttps ? https : http;
	}

	post(path, data, headers, callback) {
		this.makeReq('POST', this.host, this.port, path, headers, callback, function(req) {
			req.write(data);
			req.end();
		});
	};

	postForm(path, formData, callback) {
		request.post({
			url: this.host + path,
			formData: formData
		}, function (err, response) {
			callback(err, response);
		});
	}

	put(path, data, headers, callback) {
		this.makeReq('PUT', this.host, this.port, path, data, headers, callback, function(req) {
			req.write(data);
			req.end();
		});
	};

	get(path, headers, callback) {
		this.makeReq('GET', this.host, this.port, path, headers, callback, function(req) {
			req.end();
		});
	};

	delete(path, headers, callback) {
		this.makeReq('DELETE', host, port, path, headers, callback, function(req) {
			req.end();
		});
	};

	makeReq(method, host, port, path, headers, requestCallback, callback) {
		const options = {
			hostname: host,
			port: port,
			path: path,
			method: method,
			headers: headers
		};

		const req = this.httpMethod.request(options, function(res) {
			log.verbose(path + ": " + JSON.stringify(res));
			if (res.statusCode < 200 || res.statusCode > 299) {
				requestCallback(
					{ 
						message: "Received error status code", 
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
}

module.exports = restHandler;