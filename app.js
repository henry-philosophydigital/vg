require('dotenv').config();
require('./utils/emailScheduler'); // Adjust the path according to your project structure

const express = require('express');
const app = express();
const { basicAuth } = require('./middleware/authentication');
const { setupApp } = require('./utils/setup');

const shopifyWebhook = require('./webhooks/shopifyWebhook');
const mailgunWebhook = require('./webhooks/mailgunWebhook');
const mailgunWebhookError = require('./webhooks/mailgunWebhookError');

const sendVirtualGiftRoute = require('./routes/sendVirtualGift'); 
const manageTemplates = require('./routes/manageTemplates'); 
const logs = require('./routes/logs'); 

setupApp(app);

app.post('/webhook', shopifyWebhook);
app.post('/mailgun-webhook', mailgunWebhook);
app.post('/mailgun-webhook-error', mailgunWebhookError);

app.use('/send-virtual-gift', basicAuth);
app.use(sendVirtualGiftRoute); 

app.use('/templates', basicAuth);
app.use(manageTemplates); 

app.use('/logs', basicAuth);
app.use(logs); 

app.listen(3000, function () {
	console.log('Hello! Server is running.');
});


