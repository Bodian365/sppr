const criteriaService = require("../services/criteriaService");

class CriteriaController {
  async create(req, res) {
    try {
      const result = await criteriaService.addCriteria(req.body);
      res.status(201).json({ message: "Критерій додано", data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getAll(req, res) {
    try {
      const criteria = await criteriaService.getAllCriteria();
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Помилка отримання критеріїв" });
    }
  }
  async delete(req, res) {
    try {
      await criteriaService.removeCriteria(req.params.id);
      res.json({ message: "Видалено" });
    } catch (error) {
      res.status(500).json({ error: "Помилка при видаленні" });
    }
  }
}
module.exports = new CriteriaController();
