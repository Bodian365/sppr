const express = require("express");
const multer = require("multer");

// Імпортуємо всі наші роутери сутностей
const alternativeRoutes = require("./alternativeRoutes");
const criteriaRoutes = require("./criteriaRoutes");
const evaluationRoutes = require("./evaluationRoutes");
const ruleRoutes = require("./ruleRoutes");

// Імпортуємо контролери для складних операцій (з попереднього кроку)
const importController = require("../controllers/importController");
const analyzeController = require("../controllers/analyzeController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// --- ПІДКЛЮЧЕННЯ CRUD РОУТІВ ---
router.use("/alternatives", alternativeRoutes);
router.use("/criteria", criteriaRoutes);
router.use("/evaluations", evaluationRoutes);
router.use("/rules", ruleRoutes);

// --- ПІДКЛЮЧЕННЯ СКЛАДНИХ ЕНДПОІНТІВ ---
router.post(
  "/import",
  upload.single("expert_file"),
  importController.importData,
);
router.get("/analyze", analyzeController.analyzeData);

module.exports = router;
