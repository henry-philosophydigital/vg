const config = require('../config');
const db = require('../utils/db'); // Adjust the path according to your project structure
const mg = require('../utils/emailService');
const logger = require('../utils/logger');

function sendEmail(row) {
  const emailData = {
	from: `Virtual Giving <${config.mailgunAddress}>`,
	to: row.to_email,
	subject: row.subject,
	html: row.html_content,
	'h:X-Mailgun-Variables': JSON.stringify({
	  orderID: orderID,
	  orderName: orderName,
	  sendTiming: sendTiming,
	  sendingOn: sendingOn
	})
  };

  // Send the email using Mailgun
  mg.messages.create(`${config.mailgunServer}`, emailData)
	.then(msg => {
	  logger.info(`Email with ID ${row.id} has been sent: ${msg.id}`);
	  // Delete the email from the database after sending
	  const deleteQuery = 'DELETE FROM emails WHERE id = ?';
	  db.run(deleteQuery, [row.id], (err) => {
		if (err) {
		  return logger.error(`Failed to delete email with ID ${row.id}: ${err.message}`);
		}
		logger.info(`Email with ID ${row.id} has been deleted from the database.`);
	  });
	})
	.catch(err => {
	  logger.error(`Failed to send email with ID ${row.id}: ${err.message}`);
	});
}

function checkAndSendEmails() {
  const now = new Date();
  const select = 'SELECT * FROM emails WHERE send_time <= ?';
  db.all(select, [now.toISOString()], (err, rows) => {
	if (err) {
	  return logger.error(`Failed to retrieve emails: ${err.message}`);
	}
	logger.error(`Checked`);
	rows.forEach(sendEmail);
  });
}

// Define an interval for checking the emails, e.g., every 15 minutes
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

setInterval(checkAndSendEmails, CHECK_INTERVAL);

module.exports = {
  checkAndSendEmails
};
