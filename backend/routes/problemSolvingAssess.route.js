const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const problemSolvingController = require("../controllers/problemSolvingassess.controller");

router.post("/start", protect,problemSolvingController.startQuiz);
router.post("/submit", problemSolvingController.submitAnswer);
router.post('/save-result', protect, problemSolvingController.saveQuizResult);


module.exports = router;
