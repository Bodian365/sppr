const evaluationRepo = require("../repositories/evaluationRepository");

class EvaluationService {
  async addEvaluation(data) {
    if (
      !data.alternative_id ||
      !data.criterion_id ||
      data.value === undefined
    ) {
      throw new Error("Неповні дані для оцінки");
    }
    return await evaluationRepo.upsert(
      data.alternative_id,
      data.criterion_id,
      data.value,
    );
  }
  async getAllEvaluations() {
    return await evaluationRepo.findAll();
  }
}
module.exports = new EvaluationService();
