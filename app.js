const express = require("express");
const db = require("./db");
const decisionService = require("./decisionService");

const app = express();
app.use(express.json());

app.post("/alternatives", (req, res) => {
  const { name, description } = req.body;
  db.run(
    `INSERT INTO alternatives (name, description) VALUES (?, ?)`,
    [name, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, message: "Альтернативу додано" });
    },
  );
});

app.get("/alternatives", (req, res) => {
  db.all(`SELECT * FROM alternatives`, [], (err, rows) => res.json(rows));
});

app.post("/criteria", (req, res) => {
  const { name, type, weight, description } = req.body;
  db.run(
    `INSERT INTO criteria (name, type, weight, description) VALUES (?, ?, ?, ?)`,
    [name, type, weight, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, message: "Критерій додано" });
    },
  );
});

app.post("/evaluations", (req, res) => {
  const { alternative_id, criterion_id, value } = req.body;
  db.run(
    `INSERT OR REPLACE INTO evaluations (alternative_id, criterion_id, value) VALUES (?, ?, ?)`,
    [alternative_id, criterion_id, value],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Оцінку збережено" });
    },
  );
});

app.get("/matrix", (req, res) => {
  const sql = `
        SELECT a.name as Alternative, c.name as Criterion, e.value, c.type, c.weight
        FROM evaluations e
        JOIN alternatives a ON e.alternative_id = a.id
        JOIN criteria c ON e.criterion_id = c.id
    `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/analyze", (req, res) => {
  const result = decisionService.calculateSAW();
  res.json(result);
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Сервер СППР запущено на http://localhost:${PORT}`),
);
