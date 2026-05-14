const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const db = require("./db");
const decisionService = require("./decisionService");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

// --- CRUD ---
app.post("/alternatives", (req, res) => {
  const { name, description } = req.body;
  db.run(
    `INSERT INTO alternatives (name, description) VALUES (?, ?)`,
    [name, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Альтернативу додано" });
    },
  );
});
app.get("/alternatives", (req, res) =>
  db.all(`SELECT * FROM alternatives`, [], (err, rows) => res.json(rows || [])),
);
app.delete("/alternatives/:id", (req, res) => {
  db.run(`DELETE FROM alternatives WHERE id = ?`, [req.params.id], () => {
    db.run(`DELETE FROM evaluations WHERE alternative_id = ?`, [req.params.id]);
    res.json({ message: "Видалено" });
  });
});

app.post("/criteria", (req, res) => {
  const { name, type, weight, description } = req.body;
  db.run(
    `INSERT INTO criteria (name, type, weight, description) VALUES (?, ?, ?, ?)`,
    [name, type, weight || 0, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Критерій додано" });
    },
  );
});
app.get("/criteria", (req, res) =>
  db.all(`SELECT * FROM criteria`, [], (err, rows) => res.json(rows || [])),
);
app.delete("/criteria/:id", (req, res) => {
  db.run(`DELETE FROM criteria WHERE id = ?`, [req.params.id], () => {
    db.run(`DELETE FROM evaluations WHERE criterion_id = ?`, [req.params.id]);
    db.run(`DELETE FROM rules WHERE criterion_id = ?`, [req.params.id]);
    res.json({ message: "Видалено" });
  });
});

app.post("/evaluations", (req, res) => {
  const { alternative_id, criterion_id, value } = req.body;
  db.run(
    `INSERT OR REPLACE INTO evaluations (alternative_id, criterion_id, value) VALUES (?, ?, ?)`,
    [alternative_id, criterion_id, value],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Збережено" });
    },
  );
});
app.get("/evaluations", (req, res) =>
  db.all(`SELECT * FROM evaluations`, [], (err, rows) => res.json(rows || [])),
);

app.post("/rules", (req, res) => {
  const { criterion_id, condition_type, threshold, action_type, action_value } =
    req.body;
  db.run(
    `INSERT INTO rules (criterion_id, condition_type, threshold, action_type, action_value) VALUES (?, ?, ?, ?, ?)`,
    [criterion_id, condition_type, threshold, action_type, action_value],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Правило збережено" });
    },
  );
});
app.get("/rules", (req, res) =>
  db.all(`SELECT * FROM rules`, [], (err, rows) => res.json(rows || [])),
);

// --- ІМПОРТ (ЕКСПЕРТИЗА) ---
app.post("/import", upload.single("expert_file"), async (req, res) => {
  const method = req.body.method || "mean";
  const mode = req.body.mode;
  const url = req.body.url;

  try {
    let fileContent = "";
    if (url && url.startsWith("http")) {
      const response = await axios.get(url);
      fileContent = response.data;
    } else if (req.file) {
      fileContent = fs.readFileSync(req.file.path, "utf8");
    } else {
      return res.status(400).json({ error: "Немає файлу або URL" });
    }

    const lines = fileContent
      .split("\n")
      .filter((l) => l.trim() !== "")
      .slice(1);

    if (mode === "weights") {
      const votes = lines.map((l) => {
        const [ex, cr, rank] = l.split(",").map(Number);
        return { expert_id: ex, crit_id: cr, rank };
      });
      db.all("SELECT id FROM criteria", (err, crits) => {
        const scores = decisionService.calculateVotingWeights(
          votes,
          method,
          crits.length,
        );
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        db.serialize(() => {
          Object.keys(scores).forEach((id) => {
            const weight = total > 0 ? scores[id] / total : 0;
            db.run("UPDATE criteria SET weight = ? WHERE id = ?", [weight, id]);
          });
        });
        if (req.file) fs.unlinkSync(req.file.path);
        res.json({
          message: "Ваги успішно перераховані за допомогою методу " + method,
        });
      });
    } else {
      const rawValues = {};
      lines.forEach((line) => {
        const [ex, alt, cr, val] = line.split(",").map(Number);
        if (!alt || !cr) return;
        const key = `${alt}_${cr}`;
        if (!rawValues[key]) rawValues[key] = [];
        rawValues[key].push(val);
      });
      db.serialize(() => {
        Object.keys(rawValues).forEach((key) => {
          const [alt, cr] = key.split("_");
          const finalVal = decisionService.calculateConsensus(
            rawValues[key],
            method,
          );
          db.run(
            `INSERT OR REPLACE INTO evaluations (alternative_id, criterion_id, value) VALUES (?, ?, ?)`,
            [alt, cr, finalVal],
          );
        });
      });
      if (req.file) fs.unlinkSync(req.file.path);
      res.json({ message: "Оцінки альтернатив успішно узгоджено!" });
    }
  } catch (e) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Помилка імпорту: " + e.message });
  }
});

// --- АНАЛІЗ ТА АНАЛІЗ ЧУТЛИВОСТІ ---
function normalizeWeights(criteria) {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  if (totalWeight === 0) return criteria;
  return criteria.map((c) => ({ ...c, weight: c.weight / totalWeight }));
}

app.get("/analyze", (req, res) => {
  const method = req.query.method || "saw";
  const sensitivity = req.query.sensitivity
    ? JSON.parse(req.query.sensitivity)
    : null;

  db.all(`SELECT * FROM alternatives`, (err, alts) => {
    db.all(`SELECT * FROM criteria`, (err, crits) => {
      if (sensitivity) {
        crits = crits.map((c) =>
          sensitivity[c.id] !== undefined
            ? { ...c, weight: parseFloat(sensitivity[c.id]) }
            : c,
        );
      }
      const normalizedCrits = normalizeWeights(crits || []);

      db.all(`SELECT * FROM evaluations`, (err, evals) => {
        db.all(`SELECT * FROM rules`, (err, rules) => {
          const result = decisionService.analyze(
            alts || [],
            normalizedCrits,
            evals || [],
            rules || [],
            method,
          );
          res.json(result);
        });
      });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Сервер СППР: http://localhost:${PORT}`));
