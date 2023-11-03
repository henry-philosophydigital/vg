const config = require('../config');  
const crypto = require('crypto');
const Shopify = require('shopify-api-node');
const logger = require('../utils/logger');

const mailgunWebhook = async (req, res) => {
	const mailgunSigningKey = `${config.mailgunApiKey}`; 

	const timestamp = req.body.signature.timestamp;
	const token = req.body.signature.token;

	if (!timestamp || !token) {
		return res.status(400).send('Invalid request. Timestamp or token missing.');
	}

	const payload = String(timestamp) + String(token);
	const expectedSignature = crypto
		.createHmac('sha256', mailgunSigningKey)
		.update(payload)
		.digest('hex');

	if (req.body.signature.signature !== expectedSignature) {
		return res.status(401).send('Invalid signature');
	}
	
	const eventData = req.body['event-data'];
	const mailgunsID = req.body['event-data'].id;
	const mailgunsTruncatedID = mailgunsID.substring(0, 4);
	const eventTimestamp = req.body['event-data'].timestamp;
	const orderIDFromMailgun = req.body['event-data']['user-variables'].orderID;
	const orderNameFromMailgun = req.body['event-data']['user-variables'].orderName;
	const recipientFromMailgun = req.body['event-data'].recipient;
	const messageFromMailgun = req.body['event-data']['delivery-status'].message;
	
	const processedDate = new Date(eventTimestamp * 1000);
	const ukLocalTime = processedDate.toLocaleString('en-GB', { timeZone: 'Europe/London' });
		
	/* console.log(req.body); */
	
	const shopify = new Shopify({
		shopName: `${config.shopifyAccount}`,
		apiKey: `${config.shopifyApiKey}`,
		password: `${config.shopifyApiPass}`
	});
		
	const orderUpdate = {
		id: orderIDFromMailgun,
		note: `#${mailgunsTruncatedID} Delivery Report. ✅ Email to [${recipientFromMailgun}] successfully delivered. It was delivered on [${ukLocalTime}]`
	}; 

	if (orderIDFromMailgun) {
		await shopify.order.update(orderIDFromMailgun, orderUpdate);
		logger.info(`✅ MAILGUN: Order [${orderNameFromMailgun}] ID [${orderIDFromMailgun}] to [${recipientFromMailgun}] successfully delivered with the message [${messageFromMailgun}]. It was delivered on [${ukLocalTime}]`);
	} else {
		logger.info(`✅ MAILGUN: Manual Send. Email to [${recipientFromMailgun}] successfully delivered with the message [${messageFromMailgun}]. It was delivered on [${ukLocalTime}]`);
	}
	
	res.status(200).send('Received');
};

module.exports = mailgunWebhook;
