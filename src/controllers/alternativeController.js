const alternativeService = require("../services/alternativeService");

class AlternativeController {
  async create(req, res) {
    try {
      const result = await alternativeService.addAlternative(req.body);
      res.status(201).json({ message: "Альтернативу додано", data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const alternatives = await alternativeService.getAllAlternatives();
      res.json(alternatives);
    } catch (error) {
      res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
  }

  async delete(req, res) {
    try {
      await alternativeService.removeAlternative(req.params.id);
      res.json({ message: "Видалено" });
    } catch (error) {
      res.status(500).json({ error: "Помилка при видаленні" });
    }
  }
}

module.exports = new AlternativeController();
