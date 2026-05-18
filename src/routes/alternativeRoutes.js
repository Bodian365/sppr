const express = require("express");
const router = express.Router();
const alternativeController = require("../controllers/alternativeController");

router.post("/", alternativeController.create);
router.get("/", alternativeController.getAll);
router.delete("/:id", alternativeController.delete);

module.exports = router;
