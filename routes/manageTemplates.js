const config = require('../config');  
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/templates', async function(req, res) {
	try {
		const files = await fs.readdir(`${config.projectDir}/templates`);
		const skus = files.map(file => file.replace('.html', ''));
	
		let pageContent = `
		
		<!DOCTYPE html>
		<html lang="en">
		<head>
		
		  <meta charset="utf-8">
		  <title>Virtual Giving - Templates</title>
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
		
		  <div class="container">
			<div class="row">
			  <div class="one-half column existing-templates">
				<h3>Edit Templates</h3>
				<ul>
		`;
	
		skus.forEach(sku => {
			pageContent += `<li><a href="/templates/${sku}">${sku}</a></li>`;
		});

		pageContent += `
				</ul>
			</div><!-- one-half column -->
			<div class="one-half column create-new-template">
				<h3>Create new template</h3>
				<p>Remember, the template name must match the Ecard SKU in Shopify exactly. No spaces, all lowercase.</p>
				<p>Formats:<br>
				wildcard--[occasion]--[design]<br>
				virtual-adoption--[animal]<br>
				<form action="/templates/new" method="post">
					<input type="text" name="sku" placeholder="Template name" required>
					<textarea placeholder="Paste code here" name="content" required></textarea>
					<input type="submit" value="Create">
				</form>
			</div> <!-- one-half column -->
		   </div> <!-- row -->
		  </div> <!-- container -->
			
			</body>
			</html>
		`;

		res.send(pageContent);
	} catch (err) {
		res.status(500).send(`Error reading templates: ${err}`);
	}
});


router.post('/templates/new', async function(req, res) {
	const sku = req.body.sku;
	const filePath = `${config.projectDir}/templates/${sku}.html`;
	try {
		await fs.access(filePath, fs.F_OK);
		res.status(400).send('A template with this name already exists.');
	} catch (err) {
		if (err.code === 'ENOENT') {
			try {
				await fs.writeFile(filePath, req.body.content, 'utf8');
				res.redirect(`/templates/${sku}?created=true`);
			} catch (writeErr) {
				res.status(500).send(`Error creating template: ${writeErr}`);
			}
		} else {
			res.status(500).send(`Error checking if template exists: ${err}`);
		}
	}
});



router.get('/templates/:sku', async function(req, res){
const sku = req.params.sku;
try {
	const template = await fs.readFile(`${config.projectDir}/templates/${sku}.html`, 'utf8');
	const created = req.query.created ? '<p class="green">Template successfully created!</p>' : '';
	const saved = req.query.saved ? '<p class="green">Saved Successfully!</p>' : '';

		let pageContent = `
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
			
			  <link rel="icon" type="image/png" href="/assets/favicon.png">
			
			</head>
			<body>
			
			<div class="header">
				<img src="/assets/logo.png">
				<ul class="nav">
					<li><a href="/templates/">Manage Templates</a></li>
					<li><a href="/send-virtual-gift/">Send a Virtual Gift</a></li>
					<li><a href="/logs/">Logs</a></li>
					<li><a href="/tutorials/">Tutorials</a></li>
				</ul>
			</div>
			
			<div class="container">
			<div class="row">
			  <div class="column edit-template">
		
			<h1>Editing <span class="bluer">${sku}</span></h1>
			
			${created}
			${saved}
			
			<form action="/templates/${sku}" method="post" onsubmit="return confirm('Are you sure you want to save?')">
				<textarea name="content">${template}</textarea>
				<input class="save button-primary" type="submit" value="Save">
			</form>
			
			<form action="/templates/${sku}?_method=DELETE" method="post" onsubmit="return confirm('Are you sure you want to delete?')">
				<input class="delete button-primary" type="submit" value="Delete">
			</form>
			
			<script>
				function confirmation() {
					return confirm('Are you sure you want to save?');
				}
			</script>
			
			</div>
			</div>
			</div>
			
			<!-- End Document
			  –––––––––––––––––––––––––––––––––––––––––––––––––– -->
			</body>
			</html>
		`;

		res.send(pageContent);
		} catch (err) {
				res.status(500).send(`Error reading template: ${err}`);
			}
		});

router.post('/templates/:sku', async function(req, res) {
	const sku = req.params.sku;
	try {
		await fs.writeFile(`${config.projectDir}/templates/${sku}.html`, req.body.content, 'utf8');
		res.redirect(`/templates/${sku}?saved=true`);
	} catch (err) {
		res.status(500).send(`Error writing template: ${err}`);
	}
});

router.delete('/templates/:sku', async function(req, res) {
	const sku = req.params.sku;
	try {
		await fs.unlink(`${config.projectDir}/templates/${sku}.html`);
		res.redirect('/templates');
	} catch (err) {
		res.status(500).send(`Error deleting template: ${err}`);
	}
});

module.exports = router;