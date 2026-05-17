const db = require("../config/db");

class EvaluationRepository {
  async upsert(alternative_id, criterion_id, value) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO evaluations (alternative_id, criterion_id, value) VALUES (?, ?, ?)`,
        [alternative_id, criterion_id, value],
        function (err) {
          if (err) return reject(err);
          resolve({ alternative_id, criterion_id, value });
        },
      );
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM evaluations`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}
module.exports = new EvaluationRepository();
