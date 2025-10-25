const express = require("express");
const router = express.Router();
const { generateQuiz, evaluateQuiz } = require("../controllers/problemSolvingassess.controller");

router.post("/quiz", generateQuiz);
router.post("/evaluate", evaluateQuiz);

module.exports = router;
