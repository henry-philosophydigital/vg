const bodyParser = require('body-parser');

const customBodyParser = bodyParser.json({
	verify: function(req, res, buf) {
		req.rawBody = buf.toString();
	}
});

module.exports = customBodyParser;