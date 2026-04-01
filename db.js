const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.resolve(__dirname, "data/spzr.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Помилка відкриття БД:", err.message);
  else console.log("Підключено до SQLite.");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS alternatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS criteria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('maximize', 'minimize')),
        weight REAL DEFAULT 1.0,
        description TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS evaluations (
        alternative_id INTEGER,
        criterion_id INTEGER,
        value REAL,
        PRIMARY KEY (alternative_id, criterion_id),
        FOREIGN KEY (alternative_id) REFERENCES alternatives(id),
        FOREIGN KEY (criterion_id) REFERENCES criteria(id)
    )`);
});

module.exports = db;
