const config = require('../config');  
const crypto = require('crypto');
const Shopify = require('shopify-api-node');
const logger = require('../utils/logger');

const mailgunWebhookError = async (req, res) => {
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
	
	const logLevel = req.body['event-data']['log-level'];
	const event = req.body['event-data'].event;
	const reason = req.body['event-data'].reason;
	const severity = req.body['event-data'].severity;
	const attemptNo = req.body['event-data']['delivery-status']['attempt-no'];
	const message = req.body['event-data']['delivery-status'].message;
	const singleLineMessage = message.replace(/\n/g, ' ').replace(/\+/g, '');
	const retrySeconds = req.body['event-data']['delivery-status']['retry-seconds'];
	
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
		note: `#${mailgunsTruncatedID} Delivery Report. ⛔️ Email to [${recipientFromMailgun}] failed. Level [${logLevel}] Event [${event}] Reason [${reason}] Severity [${severity}] Attempt # [${attemptNo}] Message from server: [${singleLineMessage}] Retrying in [${retrySeconds} seconds]`
	}; 
	
	if (orderIDFromMailgun) {
		await shopify.order.update(orderIDFromMailgun, orderUpdate);
		logger.error(`#${mailgunsTruncatedID} Delivery Report. ⛔️ Email to [${recipientFromMailgun}] failed. Level [${logLevel}] Event [${event}] Reason [${reason}] Severity [${severity}] Attempt # [${attemptNo}] Message from server: [${singleLineMessage}] Retrying in [${retrySeconds} seconds]`);
	} else {
		logger.error(`#${mailgunsTruncatedID} Delivery Report. ⛔️ Manual Email to [${recipientFromMailgun}] failed. Level [${logLevel}] Event [${event}] Reason [${reason}] Severity [${severity}] Attempt # [${attemptNo}] Message from server: [${singleLineMessage}] Retrying in [${retrySeconds} seconds]`);
	}
	
	res.status(200).send('Received');
};

module.exports = mailgunWebhookError;
