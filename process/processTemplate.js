const fs = require('fs').promises;
const logger = require('../utils/logger');
const config = require('../config');  

async function processTemplate(item, orderData) {
  const sku = item.sku;
  const properties = item.properties;
  let donation = '', recipientsName = '', yourName = '', yourMessage = '', recipientsEmail = '',  sendTiming = ''; sendingOn = '';
  let orderName = orderData.name || '';
  let orderID = orderData.id || '';
  
  /* console.log(orderData);
  console.log(item); */
  
  for(let j = 0; j < properties.length; j++) {
	switch(properties[j].name) {
	  case 'Donation':
		donation = properties[j].value;
		break;
	  case "Recipient's Name":
		recipientsName = properties[j].value;
		break;
	  case 'Your Name':
		yourName = properties[j].value;
		break;
	  case 'Your Message':
		yourMessage = properties[j].value;
		break;
	  case "Recipient's Email":
		recipientsEmail = properties[j].value;
		break;
	  case 'When to send':
		  sendTiming = properties[j].value;
		  break;
	  case 'Sending on':
		  sendingOn = properties[j].value;
		  break;
	}
  }
  const data = await fs.readFile(`${config.projectDir}/templates/${sku}.html`, 'utf8');
  return {
	processedData: data
	  .replace(/{SKU}/g, sku)
	  .replace(/{DONATION}/g, donation)
	  .replace(/{RECIPIENTS_NAME}/g, recipientsName)
	  .replace(/{YOUR_NAME}/g, yourName)
	  .replace(/{YOUR_MESSAGE}/g, yourMessage)
	  .replace(/{RECIPIENTS_EMAIL}/g, recipientsEmail),
	recipientsEmail: recipientsEmail,
	yourName: yourName,
	sendTiming: sendTiming,
	sendingOn: sendingOn,
	orderName: orderName,
	orderID: orderID
  };
}

module.exports = processTemplate;