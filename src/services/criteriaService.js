const criteriaRepo = require("../repositories/criteriaRepository");

class CriteriaService {
  async addCriteria(data) {
    if (!data.name || !data.type) {
      throw new Error("Ім'я та тип критерію є обов'язковими");
    }
    return await criteriaRepo.create(
      data.name,
      data.type,
      data.weight,
      data.description,
    );
  }
  async getAllCriteria() {
    return await criteriaRepo.findAll();
  }
  async removeCriteria(id) {
    return await criteriaRepo.deleteById(id);
  }
}
module.exports = new CriteriaService();
