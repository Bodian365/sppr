const db = require("../config/db"); // Для швидкості перенесення використаємо прямий запит. В ідеалі - замінити на виклики Репозиторіїв.
const decisionService = require("../services/decisionService");

class AnalyzeController {
  async analyzeData(req, res) {
    const method = req.query.method || "saw";
    const sensitivity = req.query.sensitivity
      ? JSON.parse(req.query.sensitivity)
      : null;

    try {
      // Використовуємо Promise.all для паралельного запиту до БД - це значно швидше, ніж вкладені колбеки!
      const [alts, crits, evals, rules] = await Promise.all([
        new Promise((res, rej) =>
          db.all(`SELECT * FROM alternatives`, [], (err, rows) =>
            err ? rej(err) : res(rows),
          ),
        ),
        new Promise((res, rej) =>
          db.all(`SELECT * FROM criteria`, [], (err, rows) =>
            err ? rej(err) : res(rows),
          ),
        ),
        new Promise((res, rej) =>
          db.all(`SELECT * FROM evaluations`, [], (err, rows) =>
            err ? rej(err) : res(rows),
          ),
        ),
        new Promise((res, rej) =>
          db.all(`SELECT * FROM rules`, [], (err, rows) =>
            err ? rej(err) : res(rows),
          ),
        ),
      ]);

      let processedCrits = crits || [];
      if (sensitivity) {
        processedCrits = processedCrits.map((c) =>
          sensitivity[c.id] !== undefined
            ? { ...c, weight: parseFloat(sensitivity[c.id]) }
            : c,
        );
      }

      // Нормалізація ваг
      const totalWeight = processedCrits.reduce(
        (sum, c) => sum + (c.weight || 0),
        0,
      );
      const normalizedCrits =
        totalWeight === 0
          ? processedCrits
          : processedCrits.map((c) => ({
              ...c,
              weight: c.weight / totalWeight,
            }));

      // Виклик чистої бізнес-логіки
      const result = decisionService.analyze(
        alts || [],
        normalizedCrits,
        evals || [],
        rules || [],
        method,
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Помилка аналізу: " + error.message });
    }
  }
}

module.exports = new AnalyzeController();
