
'use strict';

//udp://h2652859.stratoserver.net:14600
//udp://45.77.232.81:14600
const inquirer = require('inquirer'),
	jsonfile = require('jsonfile');

let configFilePath = (process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || process.cwd()) + '/iota-eagle.conf';


/**
 * process user's answers and create config object
 * @param {Object} answers answers received from inquirer
 * @returns {Object} config object
 */
function processAnswers(answers){
	let config = {peers:[]};
	config.iri = answers.iri;
	config.port = answers.port;
	config.password = answers.password;
	config.refresh = answers.refresh;
	return config;
}

/**
 * process user's answers and create a config object
 * @param {Object}
 */
function createConfig(config){
	jsonfile.writeFileSync(configFilePath, config, { spaces: 2, EOL: '\r\n' });
	console.log('successfully created/updated ' + configFilePath );
}

/**
 * ask few questions on command prompt
 * @returns {Promise} The promise with the result of the prompt
 */
function questions(){
	return inquirer.prompt([
		{
			type: 'input',
			name: 'iri',
			message: 'What is your IRI address?',
			default: '127.0.0.1:14265',
			filter(input){
				return 'http://'+input;
			},
			validate(input){
				let port = new RegExp(/:(\d)+$/);
				let has_port = input.trim().match(port);
				if(!has_port)
					return 'You must tell us the IRI address with valid port number. Try again.';
                
				return true;
			}
		},
		{
			type: 'input',
			name: 'port',
			message: 'What is the port number, you want to host?',
			default: '8001',
			filter(input) {
				return '0.0.0.0:' + input;
			},
			validate(input) {
				let port = new RegExp(/(\d)+/);
				let has_port = input.trim().match(port);
				if (!has_port)
					return 'You must tell us the port number. Try again.';
				return true;
			}
		},
		{
			type: 'input',
			name: 'refresh',
			message: 'Whats the IRI fetch frequency in seconds? between 5 to 600',
			default: 10,
			validate(input) {
				if ( input < 5 ||input > 600 )
					return 'You must choose a number between 5 to 600. Try again.';
				return true;
			}
		},
		{
			type: 'password',
			name: 'password',
			message: 'Create a new password',
			validate(input) {
				if (input.length < 5)
					return 'You must type in a password with more than 5 characters. Try again.';
				return true;
			}
		},
		{
			type: 'confirm',
			name: 'confirm',
			message: 'Are the details above are correct?',
			default: true
		}
	]).then(answers => {

		if(!answers.confirm)
			process.exitCode = 0;
		else{
			let config = processAnswers(answers);
			createConfig(config);
		}

	});
}

// function handleError(fn) {
// 	return function (...params) {
// 		return fn(...params).catch((err) => {
// 			console.error(err.message);
// 			console.error(err.stack);
// 		});
// 	};
// }


//------------------------------------------------------------------------------------------------------------------
// Public interface 
//------------------------------------------------------------------------------------------------------------------

const config = {
	configFilePath,
	createConfig,
	initConfig(){
		return require('./helper').handleError(questions)();
	}
};

module.exports = config;