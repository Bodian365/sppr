const evaluationService = require("../services/evaluationService");

class EvaluationController {
  async create(req, res) {
    try {
      await evaluationService.addEvaluation(req.body);
      res.status(201).json({ message: "Збережено" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getAll(req, res) {
    try {
      const evaluations = await evaluationService.getAllEvaluations();
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Помилка отримання оцінок" });
    }
  }
}
module.exports = new EvaluationController();
