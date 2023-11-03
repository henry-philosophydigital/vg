const config = require('../config');  
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/logs', async function(req, res) {
  try {
	const logContents = await fs.readFile(`${config.projectDir}/ecard-app.log`, 'utf-8');
	const logLines = logContents.split('\n').reverse();
	
	const listItems = logLines.map(line => {
	  let cssClass = '';
	  let orderCode = '';
	  if (line.includes('SHOPIFY:')) cssClass = 'shopify';
	  if (line.includes('MAILGUN:')) cssClass = 'mailgun';
	  if (line.includes('[ERROR]')) cssClass = 'error';
	
	  const orderMatch = line.match(/Order \[WWF(\d+)\]/);
	  if (orderMatch) {
		orderCode = `data-order-code="WWF${orderMatch[1]}"`;
	  }
	
	  return `<li class="${cssClass}" ${orderCode}>${line}</li>`;
	}).join('');

	const listLogContents = `<ul id="logList">${listItems}</ul>`;
	
	let pageContent = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	  <meta charset="utf-8">
	  <title>Virtual Giving - Logs</title>
	  <link rel="stylesheet" type="text/css" href="/assets/normalize.css">
	  <link rel="stylesheet" type="text/css" href="/assets/skeleton.css">
	  <link rel="stylesheet" type="text/css" href="/assets/send-styles.css">
	  <link rel="icon" type="image/png" href="images/favicon.png">
	  <style>
		.shopify { color: green; }
		.mailgun { color: mediumblue; }
		.error { color: red; }
	  </style>
	  <script>
		window.onload = function() {
		  const logList = document.getElementById('logList');
		  document.getElementById('filter').addEventListener('change', function() {
			const value = this.value;
			logList.querySelectorAll('li').forEach(li => {
			  if (value === 'all' || li.classList.contains(value)) {
				li.style.display = '';
			  } else {
				li.style.display = 'none';
			  }
			});
		  });

		  document.getElementById('orderSearch').addEventListener('input', function() {
			const searchValue = this.value.toUpperCase();
			logList.querySelectorAll('li').forEach(li => {
			  const orderCode = li.getAttribute('data-order-code') || '';
			  if (!searchValue || orderCode.includes(searchValue)) {
				li.style.display = '';
			  } else {
				li.style.display = 'none';
			  }
			});
		  });
		};
	  </script>
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
	  
	  <div class="container">
		<div class="row">
		  <div class="one-whole column" style="padding: 2rem;">
			<!--<select id="filter">
			  <option value="all">All</option>
			  <option value="info">Info</option>
			  <option value="error">Error</option>
			</select>-->
			<input type="text" id="orderSearch" placeholder="Order">
			<div style="display: block; max-width: 100%;">
			  ${listLogContents}
			</div>
		  </div>
		</div>
	  </div>
	</body>
	</html>
	`;

	res.send(pageContent);
  } catch (err) {
	res.status(500).send(`Error reading logs: ${err}`);
  }
});

module.exports = router;
