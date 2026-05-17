const decisionService = require("./decisionService");
const db = require("../config/db"); // Поки що залишимо прямий виклик db для пакетних оновлень, щоб не ускладнювати

class ImportService {
  async processImport(fileContent, mode, method) {
    const lines = fileContent
      .split("\n")
      .filter((l) => l.trim() !== "")
      .slice(1);

    if (mode === "weights") {
      const votes = lines.map((l) => {
        const [ex, cr, rank] = l.split(",").map(Number);
        return { expert_id: ex, crit_id: cr, rank };
      });

      return new Promise((resolve, reject) => {
        db.all("SELECT id FROM criteria", (err, crits) => {
          if (err) return reject(err);

          const scores = decisionService.calculateVotingWeights(
            votes,
            method,
            crits.length,
          );
          const total = Object.values(scores).reduce((a, b) => a + b, 0);

          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            Object.keys(scores).forEach((id) => {
              const weight = total > 0 ? scores[id] / total : 0;
              db.run("UPDATE criteria SET weight = ? WHERE id = ?", [
                weight,
                id,
              ]);
            });
            db.run("COMMIT", (err) => {
              if (err) reject(err);
              else
                resolve(
                  `Ваги успішно перераховані за допомогою методу ${method}`,
                );
            });
          });
        });
      });
    } else {
      // Режим узгодження оцінок
      const rawValues = {};
      lines.forEach((line) => {
        const [ex, alt, cr, val] = line.split(",").map(Number);
        if (!alt || !cr) return;
        const key = `${alt}_${cr}`;
        if (!rawValues[key]) rawValues[key] = [];
        rawValues[key].push(val);
      });

      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
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
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve("Оцінки альтернатив успішно узгоджено!");
          });
        });
      });
    }
  }
}

module.exports = new ImportService();
