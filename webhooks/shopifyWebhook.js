const config = require('../config');
const crypto = require('crypto');
const processTemplate = require('../process/processTemplate');
const SECRET = config.shopifyWebhookSecret;
const mg = require('../utils/emailService');
const logger = require('../utils/logger');
const db = require('../utils/db'); // Ensure you have this file set up as per the previous instructions

const shopifyWebhook = async (req, res) => {
  const hmacHeader = req.get('X-Shopify-Hmac-SHA256');
  const hash = crypto
	.createHmac('sha256', SECRET)
	.update(req.rawBody, 'utf8', 'hex')
	.digest('base64');

  if (hash !== hmacHeader) {
	logger.info('Invalid webhook');
	res.status(403).end();
	return;
  }

  const lineItems = req.body.line_items;
  let errors = [];

  for (const item of lineItems) {
	if (item.vendor !== 'Ecard') {
	  continue;
	}

	let timingLog;

	try {
	  const { processedData, recipientsEmail, yourName, sendTiming, sendingOn, orderName, orderID } = await processTemplate(item, req.body);

	  let emailSubject;
	  if (item.title.includes('Wildcard')) {
		emailSubject = `You have been sent a Wildcard from ${yourName}`;
	  } else if (item.title.includes('Adoption')) {
		emailSubject = `You have been sent a virtual adoption from ${yourName}`;
	  } else {
		emailSubject = `You have been sent a virtual gift from ${yourName}`;
	  }

	  const emailData = {
		from: `Virtual Giving <${config.mailgunAddress}>`,
		to: recipientsEmail,
		subject: emailSubject,
		html: processedData,
		'h:X-Mailgun-Variables': JSON.stringify({
		  orderID: orderID,
		  orderName: orderName,
		  sendTiming: sendTiming,
		  sendingOn: sendingOn
		})
	  };

	  let parsedDate = new Date(sendingOn);
	  const ukDateString = parsedDate.toLocaleString('en-GB', { timeZone: 'Europe/London' });
	  const currentDate = new Date();
	  let emailScheduled = false;

	  if (sendTiming === 'On a certain date and time') {
		let timeDifference = parsedDate.getTime() - currentDate.getTime();
		/* if (timeDifference > 3 * 24 * 60 * 60 * 1000) { // More than 3 days ahead */
		  const insert = 'INSERT INTO emails (to_email, subject, html_content, send_time) VALUES (?, ?, ?, ?)';
		  db.run(insert, [recipientsEmail, emailSubject, processedData, parsedDate.toISOString()], function(err) {
			if (err) {
			  logger.error(`⛔️ Database Error: ${err.message}`);
			} else {
			  emailScheduled = true;
			  logger.info(`✅ SHOPIFY: Order [${orderName}] ID [${orderID}] to [${recipientsEmail}] scheduled for [${ukDateString}] and stored in the database.`);
			}
		  });
		/* } */

		if (!emailScheduled) {
		  emailData['o:deliverytime'] = parsedDate.toUTCString();
		  timingLog = ` 🕣 SCHEDULED: User Time [${sendingOn}] [${ukDateString}]`;

		  await mg.messages.create(`${config.mailgunServer}`, emailData)
			.then(msg => {
			  logger.info(`✅ SHOPIFY: Order [${orderName}] ID [${orderID}] to [${recipientsEmail}] successfully passed to Mailgun. ${timingLog}`);
			})
			.catch(err => {
			  logger.error(`⛔️ Mailgun Error: ${err.message}`);
			  logger.error(`⛔️ orderName: ${orderName}`); 
			  logger.error(`⛔️ orderID: ${orderID}`); 
			  logger.error(`⛔️ sendTiming: ${sendTiming}`); 
			  logger.error(`⛔️ sendingOn: ${sendingOn}`); 
			  logger.error(`⛔️ parsedDate: ${parsedDate}`); 
			  logger.error(`⛔️ timingLog: ${timingLog}`);
			});
		}
	  } else {
		// Send immediately if not scheduled for a specific time
		await mg.messages.create(`${config.mailgunServer}`, emailData)
		  .then(msg => {
			logger.info(`✅ SHOPIFY: Immediate Order [${orderName}] ID [${orderID}] to [${recipientsEmail}] successfully sent by Mailgun.`);
		  })
		  .catch(err => {
			logger.error(`⛔️ Mailgun Immediate Send Error: ${err.message}`);
			logger.error(`⛔️ orderName: ${orderName}`);
			logger.error(`⛔️ orderID: ${orderID}`);
		  });
	  }
	} catch (err) {
	  logger.error(`⛔️ ERROR ${item.sku}: ${err}`);
	  errors.push(err);
	}
  }

  if (errors.length > 0) {
	res.status(500).send('⛔️ Error processing orders.');
  } else {
	res.status(200).end();
  }
};

module.exports = shopifyWebhook;
