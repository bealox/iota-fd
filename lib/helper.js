

/**
 * catch errors when using async
 * @returns {Function}
 */

let request = require('request-promise');



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


let helper = {
	uriWithoutProtocal,
	handleError,
	dnsLookUp
};

module.exports = helper;