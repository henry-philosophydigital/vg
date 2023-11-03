const formData = require('form-data');
const Mailgun = require('mailgun.js');
const config = require('../config');  
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
	username: 'api',
	key: config.mailgunApiKey,
	url: 'https://api.eu.mailgun.net'
}); 

module.exports = mg;
