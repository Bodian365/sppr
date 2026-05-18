const db = require("./db");

const alternatives = [
  { name: "DigitalOcean Basic", description: "Дешевий сервер для старту" },
  { name: "AWS EC2 t3.medium", description: "Хмарний сервер від Amazon" },
  { name: "Hetzner CPX31", description: "Сервер з високою продуктивністю" },
];

const criteria = [
  {
    name: "Ціна на місяць ($)",
    type: "minimize",
    weight: 0.4,
    description: "Вартість оренди",
  },
  {
    name: "Оперативна пам'ять (GB)",
    type: "maximize",
    weight: 0.3,
    description: "Обсяг RAM",
  },
  {
    name: "Кількість ядер CPU",
    type: "maximize",
    weight: 0.2,
    description: "Продуктивність",
  },
  {
    name: "Пропускна здатність (TB)",
    type: "maximize",
    weight: 0.1,
    description: "Трафік",
  },
];

const evaluations = [
  // DigitalOcean (id: 1)
  { alt_id: 1, crit_id: 1, value: 12 }, // Ціна
  { alt_id: 1, crit_id: 2, value: 2 }, // RAM
  { alt_id: 1, crit_id: 3, value: 2 }, // CPU
  { alt_id: 1, crit_id: 4, value: 2 }, // Трафік
  // AWS (id: 2)
  { alt_id: 2, crit_id: 1, value: 30 }, // Ціна
  { alt_id: 2, crit_id: 2, value: 4 }, // RAM
  { alt_id: 2, crit_id: 3, value: 2 }, // CPU
  { alt_id: 2, crit_id: 4, value: 5 }, // Трафік
  // Hetzner (id: 3)
  { alt_id: 3, crit_id: 1, value: 15 }, // Ціна
  { alt_id: 3, crit_id: 2, value: 8 }, // RAM
  { alt_id: 3, crit_id: 3, value: 4 }, // CPU
  { alt_id: 3, crit_id: 4, value: 20 }, // Трафік
];

db.serialize(() => {
  console.log("Очищення бази даних...");
  db.run("DELETE FROM evaluations");
  db.run("DELETE FROM criteria");
  db.run("DELETE FROM alternatives");

  console.log("Наповнення даними...");

  const insertAlt = db.prepare(
    "INSERT INTO alternatives (id, name, description) VALUES (?, ?, ?)",
  );
  alternatives.forEach((a, index) =>
    insertAlt.run(index + 1, a.name, a.description),
  );
  insertAlt.finalize();

  const insertCrit = db.prepare(
    "INSERT INTO criteria (id, name, type, weight, description) VALUES (?, ?, ?, ?, ?)",
  );
  criteria.forEach((c, index) =>
    insertCrit.run(index + 1, c.name, c.type, c.weight, c.description),
  );
  insertCrit.finalize();

  const insertEval = db.prepare(
    "INSERT INTO evaluations (alternative_id, criterion_id, value) VALUES (?, ?, ?)",
  );
  evaluations.forEach((e) => insertEval.run(e.alt_id, e.crit_id, e.value));
  insertEval.finalize();

  console.log("Дані успішно завантажено! Можете запускати сервер.");
});
