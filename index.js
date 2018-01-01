#!/usr/bin/env node

'use strict';

//Vue JS
//Uses Vue commponent And Vue routes


let express = require('express');
let app = express();
let cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

let server = require('http').Server(app);
// enables real - time bidirectional event - based communication.It consists in:
let io = require('socket.io')(server);
let minimist = require('minimist');
let IOTAConfig = require('./lib/iota');
let helper = require('./lib/helper');
const config = require('./lib/config.js');


process.on('unhandledRejection', (err) => {
	console.log('Unhandled Rejection at: ' + err.stack);
});

let argv = minimist(process.argv.slice(2), {
	string: [ 'iri', 'port' ],   // you want this to be treated as string
	alias: {
		h: 'help',
		r: 'iri',
		p: 'port',
		d: 'debug',
		i: 'init',
		v: 'version'
	}
});

//adding a debug feature
let debug = argv.debug;

//if help is true , print help
if (argv.help) printHelp();

//FIXME: fix description 
function printHelp()
{

	console.log('IPM:    IOTA Friend - let take ');
	console.log('        Manage and monitor IOTA peer health status in beautiful dashboard.');    

	console.log('Usage:');        
	console.log('iota-pm [--iri=iri_api_url] [--port=your_local_port] [--refresh=interval]');
	console.log('  -r --iri       = The API endpoint for IOTA IRI implementation (Full Node). ');
	console.log('  -p --port      = Local server IP and port where the dashboard web server should be running');    
	console.log('  -i --init   = Initialize an iota-eagle config file');    
	console.log('  -h --help      = print this message');    
	console.log('');            
	console.log('Example.');            
	console.log('iota-pm -i http://127.0.0.1:14800 -p 127.0.0.1:8888');            
	console.log('IPM will connect to IOTA endpoint and produce the status at localhost port 8888');            
	console.log('To view the dashboard, simply open a browser and point to http://127.0.0.1:8888');                
	console.log('');       
	process.exit(0);
}

if(argv.version){
	console.log(`v${require('./package.json').version}`);
	process.exit(0);
}


async function main(){

	let configObject = await helper.safeReadConfig();
	
	

	if (argv.init) {

		await config.initConfig();
		process.exitCode = 0;

	}else{

		if(!configObject)
			throw new Error('Please initialise iota-eagle first, iota-eagle -i');

		
		let iota = new IOTAConfig(configObject);


		/** 
		 *  routes for the app :D
		*/
		app.use(express.static(__dirname + '/public'));

		app.get('/login', async (req, res) => {
			res.sendFile(__dirname + '/public/login.html');
		});

		app.get('/logout', async (req, res) => {
			res.clearCookie('iota-fd');
			res.redirect('/');
		});

		/** 
		 * fired upon a connection from client
		*/
		io.on('connection', function (s) {
			// name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			//clear the cookie if the iota-fd vlue is incorrect
			let logged = function(s){
				let cookie = require('cookie').parse(s.handshake.headers.cookie);
				if(cookie['iota-fd']){
					if(cookie['iota-fd'] === iota.config.uid)
						return true;	
					else
						return false;
				}		
				return false;
			};


			iota.sockets.push(s);

			//send out or give node info
			s.emit('init', { loggedInfo: logged(s) });
			// s.emit('nodeInfo', iota.gNodeInfo);
			
			//update config info
			iota.updatePeerInfo();

			//disconnect5
			s.on('disconnect', function(data){
				let i = iota.sockets.indexOf(s);
				if(i != -1) {
				//remove index i and remove only 1 item
					iota.sockets.splice(i, 1);
				}
			});

			//add peer
			s.on('addPeer', function (data) {
				console.log('!!!!Adding peer',data);
				try{
					iota.iri.api.addNeighbors([data.address], function(error, result) {
						if (error) {
							console.error(error);
							s.emit('result', error.message);
						} else {
							s.emit('result', 'Peer added Successfully.');
							
							helper.safeDNSLookUp(data.address).then( ipObject => {

								//check this peer already exists in the config.
								//if it does, then igore.
								let alreadyExist = iota.config.peers.find( peer => {return peer.address === data.address; });

								if(!alreadyExist){
									let country = ipObject.country || '	';
									let countryCode = ipObject.countryCode || 'unknown';
									let new_obj = { 'address': data.address, 'country': country, 'country_code': countryCode.toLowerCase(), 'description': '' };
									iota.config.peers.push(new_obj);
									iota.saveConfig();
								}

								iota.updatePeerInfo();
							});

						}
					});
					iota.saveConfig();
				}
				catch(e){
					s.emit('result', e.message);
				}
			});

			s.on('removePeer', function (data) {
				console.log('!!!!Removing peer',data);
				try {
					iota.iri.api.removeNeighbors([data.address], function(error, result) {
						if (error) {
							console.error(error);
							s.emit('result', error.message);
						} else {
							s.emit('peerDeleted', data);  

							//remove in config
							let index = iota.config.peers.findIndex(obj => obj.address === data.address);
							if(index >= 0 ){
								iota.config.peers.splice(index, 1);
								iota.saveConfig();
							}
						}
					});
				}
				catch(e){
					s.emit('result', e.message);
				}
			});

			s.on('updateTag', function (data) {
				iota.config.peers.find((peer) => {
					let uriWithoutProtocal = helper.uriWithoutProtocal(peer.address);
					if (data.address === uriWithoutProtocal){
						peer.description = data.tag;
						return;
					}
				});
				iota.saveConfig();
			});

			/**
			 * Login page
			 */

			s.on('Login', function (data) {
				if(data.password === iota.config.password && data.username === iota.config.username)
					s.emit('LoginResult', {status: 'successed', uid: iota.config.uid});
				else
					s.emit('LoginResult', { status: 'failed' });
			});

		});

		// Create IOTA instance directly with provider
	
		setInterval(function () {
			// now you can start using all of the functions
			iota.getNeighbours();
		}, iota.config.refresh * 1000 || 10000);

		iota.getSystemInfo();
		iota.getNeighbours();
		iota.initialisePeer();
		iota.getIRIVersion();


		setInterval(function(){
			iota.getSystemInfo();
		},30000);

		let hostURI = iota.config.port.split(':');
		let port = hostURI[1];
		let host = hostURI[0];

		console.log('IOTA Eagle lanches at http://'+host+':'+port);

		server.listen(port,host);
	}
}

main();


