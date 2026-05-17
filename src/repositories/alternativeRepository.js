const db = require("../config/db");

class AlternativeRepository {
  async create(name, description) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO alternatives (name, description) VALUES (?, ?)`,
        [name, description],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, name, description });
        },
      );
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM alternatives`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  async deleteById(id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`BEGIN TRANSACTION`);
        db.run(`DELETE FROM evaluations WHERE alternative_id = ?`, [id]);
        db.run(`DELETE FROM alternatives WHERE id = ?`, [id], function (err) {
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

module.exports = new AlternativeRepository();
