const config = require('../config');  

function basicAuth(req, res, next) {
	const auth = {login: config.basicAuthUser, password: config.basicAuthPass}
	
	const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
	const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

	if (login && password && login === auth.login && password === auth.password) {
		return next();
	}
	
	// Access denied...
	res.set('WWW-Authenticate', 'Basic realm="401"');
	res.status(401).send('Authentication required.');
}

module.exports = {
	basicAuth
};