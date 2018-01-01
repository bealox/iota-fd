

/**
 * catch errors when using async
 * @returns {Function}
 */

let request = require('request-promise'),
	crypto = require('crypto'),
	jsonfile = require('jsonfile'),
	config = require('./config.js');



/**
 * Handle error for promise and callback
 * @returns {Function}
 */
function handleError(fn) {
	return function (...params) {
		return fn(...params).catch((err) => {
			console.error(err.message);
			console.error(err.stack);
		});
	};
}


/**
 * After adding a peer, call this to construct an object and update the config
 * @returns {Promise} The promise with the result of request-promise
 */
function dnsLookUp(host) {
	let dns = host.split('/')[2];
	dns = dns.split(':')[0];
	return request({uri: 'http://ip-api.com/json/' + dns, json: true});
}

/**
 * remove TCP:// or UDP:// in the address 
 * @returns {Sring} 
 */

function uriWithoutProtocal(url){
	return url.split('/')[2];
}

/**
 * ceate session Id for authentication
 * @returns {Sring} 
 */
function randomNumber(){
	return crypto.randomBytes(12).toString('hex');
}


let readConfig = () => {
	return new Promise((resolve, reject) => {
		jsonfile.readFile(config.configFilePath, function (err, obj) {
			if (err)
				reject(err);
			else if (obj)
				resolve(obj);
		});
	});
};

//functions that handle error
let safeDNSLookUp = handleError(dnsLookUp);
let safeReadConfig = handleError(readConfig);


let helper = {
	randomNumber,
	uriWithoutProtocal,
	handleError,
	safeDNSLookUp,
	safeReadConfig
};

module.exports = helper;