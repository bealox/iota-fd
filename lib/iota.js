let IOTA_Lib = require('iota.lib.js'),
	jsonfile = require('jsonfile'),
	helper = require('./helper'),
	request = require('request-promise');
	
var IOTA = module.exports = function(config){
	this.config = config;
	this.iri = new IOTA_Lib({
		'provider': (config.iri || 'http://localhost:14800')
	});
	this.sockets = [];
	this.nodeInfo = {};
	this.peersInfo = [];
	this.init = false;

};

IOTA.prototype.saveConfig = function() {
	jsonfile.writeFile(require('./config.js').configFilePath, this.config, { spaces: 2 }, function (err) {
		if (err) console.error(err);
	});
};

IOTA.prototype.updateNodeInfo = function() {
	this.sockets.forEach(function (s) {
		s.emit('nodeInfo', this.nodeInfo);
	});
};

IOTA.prototype.updatePeerInfo = function(peer) {
	this.peersInfo.forEach(function (peer) {
		//FIXME: need to grab the real address name
		// peer.tag = configFile[peer.address] || 'Unknown Peer';
		let peerConfig = this.config.peers.find( p => {
			let configAddress = helper.uriWithoutProtocal(p.address);
			return peer.address === configAddress;
		});

		if (peerConfig){
			peer.tag = peerConfig.description || 'Unknown Peer';
			peer.country = peerConfig.country;
			peer.countryCode = peerConfig.country_code;
		}else{
			peer.tag = 'Stranger';
			peer.country = 'Stranger Island';
			peer.countryCode = 'Stranger Country';
		}
		

		if (peerConfig){
			// peer.tag = peerConfig.description || 'Unknown Peer';
			peer.country = peerConfig.country;
			peer.countryCode = peerConfig.country_code;
		}
		this.sockets.forEach(function (s) {
			s.emit('peerInfo', peer);
		});
	}.bind(this));
};

// https://api.github.com/repos/iotaledger/iri/releases/latest

/**
 * get the iri version 
 */
IOTA.prototype.getIRIVersion = function(){
	var options = {
		url: 'https://api.github.com/repos/iotaledger/iri/releases/latest',
		jaon: true,
		method: 'GET',
		headers: {'user-agent': 'node.js'}
	};
	request(options).then( obj => {
		this.sockets.forEach(function (s) {
			var j = JSON.parse(obj);
			console.log(j.tag_name);
			s.emit('latestIRIVersion', j.tag_name);
		});
	}).catch(error => {
		console.log('unable to read the latest version of iri on github API ' + error.message);
	});
};

/**
 * add the peers from config when you start the app.
 */
IOTA.prototype.initialisePeer = function(){
	let peers  = this.config.peers;
	peers.forEach( peer => {
		if(peer.address){
			this.iri.api.addNeighbors([peer.address],  (error, result) => {
				if (error)
					console.error(error);
				else
					this.updatePeerInfo();
			});
		}
	});
};


IOTA.prototype.getNeighbours = function() {
	this.iri.api.getNeighbors(function (error, peers) {
		if (error) {
			console.error(error);
		} else {
			// console.log(peers);
			this.peersInfo = peers;
			this.updatePeerInfo();
		}
	}.bind(this));
};

IOTA.prototype.getSystemInfo = function () {
	this.iri.api.getNodeInfo(function (error, success) {
		if (error) {
			console.error(error);
		} else {
			//console.log(success);
			this.nodeInfo = success;
			this.updateNodeInfo();
		}
	}.bind(this));

};




