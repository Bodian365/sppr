class DecisionService {
  // --- 1. МЕТОДИ ГОЛОСУВАННЯ (для ваг) ---
  calculateVotingWeights(votes, method, criteriaCount) {
    const scores = {};
    const experts = [...new Set(votes.map((v) => v.expert_id))];
    const critIds = [...new Set(votes.map((v) => v.crit_id))];

    switch (method) {
      case "relative_majority":
        votes
          .filter((v) => v.rank === 1)
          .forEach((v) => {
            scores[v.crit_id] = (scores[v.crit_id] || 0) + 1;
          });
        break;

      case "absolute_majority":
        let firstTour = {};
        votes
          .filter((v) => v.rank === 1)
          .forEach((v) => {
            firstTour[v.crit_id] = (firstTour[v.crit_id] || 0) + 1;
          });
        let winner = Object.keys(firstTour).find(
          (id) => firstTour[id] > experts.length / 2,
        );
        if (winner) {
          scores[winner] = 1;
        } else {
          let sorted = Object.entries(firstTour).sort((a, b) => b[1] - a[1]);
          if (sorted.length >= 2) {
            scores[sorted[0][0]] = 0.6;
            scores[sorted[1][0]] = 0.4;
          } else if (sorted.length === 1) {
            scores[sorted[0][0]] = 1;
          }
        }
        break;

      case "borda":
        votes.forEach((v) => {
          const points = criteriaCount - v.rank;
          scores[v.crit_id] = (scores[v.crit_id] || 0) + points;
        });
        break;

      case "condorcet":
        critIds.forEach((c1) => {
          let totalWins = 0;
          critIds.forEach((c2) => {
            if (c1 === c2) return;
            let c1_wins = 0;
            experts.forEach((e) => {
              let r1 =
                votes.find((v) => v.expert_id === e && v.crit_id === c1)
                  ?.rank || 99;
              let r2 =
                votes.find((v) => v.expert_id === e && v.crit_id === c2)
                  ?.rank || 99;
              if (r1 < r2) c1_wins++;
            });
            if (c1_wins > experts.length / 2) totalWins++;
          });
          scores[c1] = totalWins;
        });
        break;
    }
    return scores;
  }

  // --- 2. МЕТОДИ УЗГОДЖЕННЯ (для значень) ---
  calculateConsensus(values, method) {
    if (!values || values.length === 0) return 0;
    if (method === "median") {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    if (method === "geometric") {
      const product = values.reduce((a, b) => a * b, 1);
      return Math.pow(product, 1 / values.length);
    }
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // --- 3. АНАЛІЗ АЛЬТЕРНАТИВ ТА ПОЯСНЕННЯ ---
  analyze(alternatives, criteria, evaluations, rules, method = "saw") {
    if (!alternatives.length || !criteria.length) {
      return { error: "Недостатньо даних для розрахунку." };
    }

    const matrix = {};
    evaluations.forEach((e) => {
      if (!matrix[e.alternative_id]) matrix[e.alternative_id] = {};
      matrix[e.alternative_id][e.criterion_id] = e.value;
    });

    const minMax = {};
    criteria.forEach((c) => {
      const vals = evaluations
        .filter((e) => e.criterion_id === c.id)
        .map((e) => e.value);

      if (vals.length > 0) {
        minMax[c.id] = {
          min: Math.min(...vals),
          max: Math.max(...vals),
          isEmpty: false,
        };
      } else {
        minMax[c.id] = { min: 0, max: 1, isEmpty: true };
      }
    });

    let results = alternatives.map((alt) => {
      let score = method === "mult" ? 1 : 0;
      let waldValues = [];
      let isFiltered = false;
      let appliedRules = [];

      rules.forEach((rule) => {
        const val = matrix[alt.id]?.[rule.criterion_id];
        if (val !== undefined && val !== null) {
          let met = false;
          if (rule.condition_type === ">") met = val > rule.threshold;
          if (rule.condition_type === "<") met = val < rule.threshold;
          if (rule.condition_type === "==") met = val == rule.threshold;

          if (met) {
            if (rule.action_type === "filter") isFiltered = true;
            appliedRules.push(rule.id);
          }
        }
      });

      if (isFiltered) return null;

      criteria.forEach((c) => {
        if (minMax[c.id].isEmpty) return;

        let raw = matrix[alt.id]?.[c.id];
        if (raw === undefined || raw === null) raw = 0;

        const mm = minMax[c.id];
        let norm = 1;

        if (c.type === "maximize") {
          const maxVal = mm.max <= 0 ? 0.001 : mm.max;
          norm = raw / maxVal;
        } else {
          const minVal = mm.min <= 0 ? 0.001 : mm.min;
          const rawVal = raw <= 0 ? 0.001 : raw;
          norm = minVal / rawVal;
        }

        norm = Math.max(0.001, norm);

        if (method === "saw") {
          score += norm * c.weight;
        } else if (method === "mult") {
          score *= Math.pow(norm, c.weight);
        } else if (method === "wald") {
          waldValues.push(norm * c.weight);
        }
      });

      if (method === "wald") {
        score = waldValues.length > 0 ? Math.min(...waldValues) : 0;
      }

      rules.forEach((rule) => {
        const val = matrix[alt.id]?.[rule.criterion_id];
        if (val !== undefined && rule.action_type === "multiply") {
          let met = false;
          if (rule.condition_type === ">") met = val > rule.threshold;
          if (rule.condition_type === "<") met = val < rule.threshold;
          if (rule.condition_type === "==") met = val == rule.threshold;
          if (met) score *= rule.action_value;
        }
      });

      return {
        id: alt.id,
        name: alt.name,
        score: Number(score.toFixed(4)),
        rules: appliedRules,
      };
    });

    results = results
      .filter((r) => r !== null)
      .sort((a, b) => b.score - a.score);

    if (results.length === 0)
      return { error: "Всі альтернативи відфільтровані правилами." };

    const best = results[0];
    let explanation = "";

    if (method === "saw") {
      const topCrit = [...criteria].sort((a, b) => b.weight - a.weight)[0];
      explanation = `Цей вибір обумовлений найбільшим впливом критерію "${topCrit.name}" (${(topCrit.weight * 100).toFixed(1)}%). `;
    } else if (method === "mult") {
      explanation = `Мультиплікативна згортка віддала перевагу варіанту, який має найменше слабких місць. `;
    } else if (method === "wald") {
      explanation = `За критерієм Вальда цей варіант є найбезпечнішим, оскільки його "найслабше" місце краще, ніж найслабші місця інших альтернатив. `;
    }

    if (best.rules.length > 0) {
      explanation += `Також до лідера було успішно застосовано ${best.rules.length} логічних правил.`;
    }

    return {
      method: method.toUpperCase(),
      best_alternative: best.name,
      explanation: explanation,
      ranking: results,
    };
  }
}

module.exports = new DecisionService();
