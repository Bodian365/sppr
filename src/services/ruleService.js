const ruleRepo = require("../repositories/ruleRepository");

class RuleService {
  async addRule(data) {
    if (
      !data.criterion_id ||
      !data.condition_type ||
      data.threshold === undefined
    ) {
      throw new Error("Неповні дані для правила");
    }
    return await ruleRepo.create(data);
  }
  async getAllRules() {
    return await ruleRepo.findAll();
  }
  async removeRule(id) {
    if (!id) throw new Error("ID правила є обов'язковим");
    return await ruleRepo.deleteById(id);
  }
}
module.exports = new RuleService();
