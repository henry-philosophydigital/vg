const express = require('express');
const methodOverride = require('method-override');
const customBodyParser = require('../middleware/bodyParser');

function setupApp(app) {
	app.use(methodOverride('_method'));
	app.use(customBodyParser);
	app.use(express.static('public'));
	app.get('/', (req, res) => {
		res.redirect('https://shop.wwf.org.au');
	});
}

module.exports = {
	setupApp
};
