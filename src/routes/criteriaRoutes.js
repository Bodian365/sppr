const express = require("express");
const router = express.Router();
const criteriaController = require("../controllers/criteriaController");

router.post("/", criteriaController.create);
router.get("/", criteriaController.getAll);
router.delete("/:id", criteriaController.delete);

module.exports = router;
