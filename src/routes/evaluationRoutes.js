const express = require("express");
const router = express.Router();
const evaluationController = require("../controllers/evaluationController");

router.post("/", evaluationController.create);
router.get("/", evaluationController.getAll);

module.exports = router;
