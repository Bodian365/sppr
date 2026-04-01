class DecisionService {
  /**
   * Майбутня реалізація методу SAW
   * На даному етапі повертає структуру готовності.
   */
  calculateSAW(alternatives, criteria, evaluations) {
    console.log(
      "Аналітичний блок: Отримано запит на розрахунок за методом SAW.",
    );

    return {
      method: "Simple Additive Weighting (SAW)",
      status: "Infrastructure Ready",
      message:
        "Розрахунок буде доступний у наступному модулі. База даних та зв'язки готові.",
      next_steps: [
        "Нормалізація матриці оцінок",
        "Множення на ваги (weights)",
        "Ранжування результатів",
      ],
    };
  }
}

module.exports = new DecisionService();
