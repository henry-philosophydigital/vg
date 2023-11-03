module.exports = {
  projectDir: process.env.PROJECT_DIR,
  mailgunServer: process.env.MAILGUN_SERVER,
  mailgunAddress: process.env.MAILGUN_ADDRESS,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  shopifyWebhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  shopifyAccount: process.env.SHOPIFY_ACCOUNT,
  shopifyApiKey: process.env.SHOPIFY_API_KEY,
  shopifyApiPass: process.env.SHOPIFY_API_PASSWORD,
  basicAuthUser: process.env.BASIC_AUTH_USER,
  basicAuthPass: process.env.BASIC_AUTH_PASSWORD
};

/* 
const config = require('../config');  

`${config.projectDir}`

*/