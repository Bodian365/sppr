const db = require("../config/db");

class RuleRepository {
  async create(data) {
    return new Promise((resolve, reject) => {
      const {
        criterion_id,
        condition_type,
        threshold,
        action_type,
        action_value,
      } = data;
      db.run(
        `INSERT INTO rules (criterion_id, condition_type, threshold, action_type, action_value) VALUES (?, ?, ?, ?, ?)`,
        [criterion_id, condition_type, threshold, action_type, action_value],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...data });
        },
      );
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM rules`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}
module.exports = new RuleRepository();
