const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./ecards.db', (err) => {
  if (err) {
	console.error(err.message);
  }
  console.log('Connected to the ECards database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS emails (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	to_email TEXT NOT NULL,
	subject TEXT NOT NULL,
	html_content TEXT NOT NULL,
	send_time DATETIME NOT NULL
  )`);
});

module.exports = db;
