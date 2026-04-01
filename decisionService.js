class DecisionService {
  calculateSAW(alternatives, criteria, evaluations) {
    // Перевірка на наявність даних
    if (!alternatives.length || !criteria.length || !evaluations.length) {
      return { error: "Недостатньо даних для аналізу. Заповніть базу." };
    }

    // 1. Формування матриці оцінок
    const matrix = {};
    evaluations.forEach((e) => {
      if (!matrix[e.alternative_id]) matrix[e.alternative_id] = {};
      matrix[e.alternative_id][e.criterion_id] = e.value;
    });

    // 2. Пошук мінімальних та максимальних значень для нормалізації
    const minMax = {};
    criteria.forEach((c) => {
      const values = evaluations
        .filter((e) => e.criterion_id === c.id)
        .map((e) => e.value);
      minMax[c.id] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    // 3. Обчислення інтегральної оцінки
    const results = alternatives.map((alt) => {
      let score = 0;
      const details = {};

      criteria.forEach((c) => {
        const rawValue = matrix[alt.id] ? matrix[alt.id][c.id] : null;
        if (rawValue === null || rawValue === undefined) return;

        let normalizedValue = 0;

        // Нормалізація в залежності від типу критерію
        if (c.type === "maximize") {
          normalizedValue = rawValue / minMax[c.id].max;
        } else if (c.type === "minimize") {
          normalizedValue = minMax[c.id].min / rawValue;
        }

        // Множення на вагу критерію
        const weightedValue = normalizedValue * c.weight;
        score += weightedValue;

        details[c.name] = {
          raw_value: rawValue,
          normalized: Number(normalizedValue.toFixed(4)),
          weighted: Number(weightedValue.toFixed(4)),
        };
      });

      return {
        id: alt.id,
        name: alt.name,
        score: Number(score.toFixed(4)),
        details: details,
      };
    });

    // 4. Ранжування
    results.sort((a, b) => b.score - a.score);

    // 5. Формування пояснення результату
    const best = results[0];
    const explanation = `Найкращою альтернативою є '${best.name}' з інтегральною оцінкою ${best.score}. Цей варіант переміг завдяки найкращому балансу оцінок після нормалізації та врахування ваги критеріїв за алгоритмом SAW.`;

    return {
      method: "Simple Additive Weighting (SAW)",
      best_alternative: best.name,
      explanation: explanation,
      ranking: results,
    };
  }
}

module.exports = new DecisionService();
