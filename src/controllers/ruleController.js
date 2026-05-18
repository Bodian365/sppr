const ruleService = require("../services/ruleService");

class RuleController {
  async create(req, res) {
    try {
      await ruleService.addRule(req.body);
      res.status(201).json({ message: "Правило збережено" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getAll(req, res) {
    try {
      const rules = await ruleService.getAllRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Помилка отримання правил" });
    }
  }
  async delete(req, res) {
    try {
      await ruleService.removeRule(req.params.id);
      res.json({ message: "Правило успішно видалено" });
    } catch (error) {
      res.status(500).json({ error: "Помилка при видаленні правила" });
    }
  }
}
module.exports = new RuleController();
