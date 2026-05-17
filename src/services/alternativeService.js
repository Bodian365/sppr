const alternativeRepo = require("../repositories/alternativeRepository");

class AlternativeService {
  async addAlternative(data) {
    if (!data.name) {
      throw new Error("Ім'я альтернативи є обов'язковим");
    }
    return await alternativeRepo.create(data.name, data.description);
  }

  async getAllAlternatives() {
    return await alternativeRepo.findAll();
  }

  async removeAlternative(id) {
    return await alternativeRepo.deleteById(id);
  }
}

module.exports = new AlternativeService();
