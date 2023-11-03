const config = require('../config');  
const express = require('express');
const router = express.Router();
const fs = require('fs').promises; 
const bodyParser = require('body-parser');
const mg = require('../utils/emailService');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/send-virtual-gift', async (req, res) => {
	try {
		const files = await fs.readdir(`${config.projectDir}/templates`);

		const skus = files
		.map(file => file.replace('.html', ''));

		let form = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
		
		  <meta charset="utf-8">
		  <title>Virtual Giving - Virtual Gifts</title>
		  <meta name="description" content="">
		  <meta name="author" content="">
		
		  <meta name="viewport" content="width=device-width, initial-scale=1">
		
		  <link rel="stylesheet" type="text/css" href="/assets/normalize.css">
		  <link rel="stylesheet" type="text/css" href="/assets/skeleton.css">
		  <link rel="stylesheet" type="text/css" href="/assets/send-styles.css">
		
		  <link rel="icon" type="image/png" href="images/favicon.png">
		
		</head>
		<body>
		
		<div class="header">
			<img src="/assets/logo.png">
			<ul class="nav">
				<li><a href="/templates/">Manage Templates</a></li>
				<li><a href="/send-virtual-gift/">Send a Virtual Gift</a></li>
				<li><a href="/logs/">Logs</a></li>
			</ul>
		</div>
			  
			<script>
			function confirmSubmit() {
				var sku = document.getElementById('sku').value;
				var donation = document.getElementById('donation').value;
				var recipientsName = document.getElementById('recipientsName').value;
				var yourName = document.getElementById('yourName').value;
				var yourMessage = document.getElementById('yourMessage').value;
				var recipientsEmail = document.getElementById('recipientsEmail').value;

				if (!sku || !donation || !recipientsName || !yourName || !yourMessage || !recipientsEmail) {
					alert('Please fill out all fields before submitting.');
					return false;
				}

				if (confirm('Do you really want to send?')) {
					return true;
				} else {
					return false;
				}
			}
			</script>
			
			<div class="container">
			<div class="row">
				  <div class="column send-an-ecard">
				  <h3>Send a Virtual Gift</h3>
				<form action="/send-virtual-gift" method="post" onsubmit="return confirmSubmit();">
				
				<div class="row">
					<div class="six columns">
						<label for="sku">Select a template:</label>
						<select id="sku" name="sku">`;
		
				skus.forEach(sku => {
					form += `<option value="${sku}">${sku}</option>`;
				});
		
				form += `
						</select>
					</div>
					<div class="six columns">	
						<label for="donation">Donation:</label>
						<input type="text" id="donation" name="donation" placeholder="$10" required>
					</div>
			</div><!-- row -->
			<div class="row">
				<div class="six columns">
					<label for="recipientsName">Recipient's Name:</label>
					<input type="text" id="recipientsName" name="recipientsName" required>
				</div>
				<div class="six columns">
					<label for="yourName">Your Name:</label>
					<input type="text" id="yourName" name="yourName" required>
				</div>
			</div><!-- row -->
			
			<div class="row">
				<div class="six columns">
					<label for="yourMessage">Your Message:</label>
					<input type="text" id="yourMessage" name="yourMessage" required>
				</div>
				<div class="six columns">
					<label for="recipientsEmail">Recipient's Email:</label>
					<input type="text" id="recipientsEmail" name="recipientsEmail" required>
				</div>
			</div><!-- row -->
			
			<div class="row">
				<input class="button-primary" type="submit" value="Submit">
			</div><!-- row -->
			
			</form>
			</div>
			</div>
			</div>
	

		</body>
		`;
		res.send(form);
	} catch (err) {
		res.status(500).send(`Error reading templates: ${err}`);
	}
});

router.post('/send-virtual-gift', async (req, res) => {

	const { sku, donation, recipientsName, yourName, yourMessage, recipientsEmail } = req.body;
	try {

		const item = {
			sku: sku,
			orderName: 'manual',
			orderID: 'manual',
			properties: [
				{ name: 'Donation', value: donation },
				{ name: "Recipient's Name", value: recipientsName },
				{ name: 'Your Name', value: yourName },
				{ name: 'Your Message', value: yourMessage },
				{ name: "Recipient's Email", value: recipientsEmail },
			],
		};
		const { processedData } = await processTemplate(item);

		const emailData = {
			from: `Virtual Giving <${config.mailgunAddress}>`,
			to: recipientsEmail,
			subject: `You have been sent a Virtual Gift from ${yourName}`,
			html: processedData,
		};
		mg.messages.create(`${config.mailgunServer}`, emailData)
			.then(msg => {
				console.log('Email sent', msg);
				res.send('Email sent successfully!');
			})
			.catch(err => {
				console.error('Error sending email', err);
				res.status(500).send(`Error sending email: ${err}`);
			});
	} catch (err) {
		console.error(`Error processing template for SKU ${sku}: ${err}`);
		res.status(500).send(`Error processing template for SKU ${sku}: ${err}`);
	}
});

async function processTemplate(item) {
  const sku = item.sku;
  const properties = item.properties;
  let donation = '', recipientsName = '', yourName = '', yourMessage = '', recipientsEmail = '',  sendTiming = ''; sendingOn = '';
  
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
	yourName: yourName
  };
}

module.exports = router;