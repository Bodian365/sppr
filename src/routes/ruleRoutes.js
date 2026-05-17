const express = require("express");
const router = express.Router();
const ruleController = require("../controllers/ruleController");

router.post("/", ruleController.create);
router.get("/", ruleController.getAll);

module.exports = router;
