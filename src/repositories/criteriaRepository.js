const db = require("../config/db");

class CriteriaRepository {
  async create(name, type, weight, description) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO criteria (name, type, weight, description) VALUES (?, ?, ?, ?)`,
        [name, type, weight || 0, description],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, name, type, weight, description });
        },
      );
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM criteria`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  async deleteById(id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`BEGIN TRANSACTION`);
        db.run(`DELETE FROM evaluations WHERE criterion_id = ?`, [id]);
        db.run(`DELETE FROM rules WHERE criterion_id = ?`, [id]);
        db.run(`DELETE FROM criteria WHERE id = ?`, [id], function (err) {
          if (err) {
            db.run(`ROLLBACK`);
            return reject(err);
          }
          db.run(`COMMIT`);
          resolve(this.changes > 0);
        });
      });
    });
  }
}
module.exports = new CriteriaRepository();
