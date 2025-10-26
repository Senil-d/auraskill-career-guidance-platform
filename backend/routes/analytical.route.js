// routes/analytical.route.js

const express = require("express");
const router = express.Router();
const analyticalController = require("../controllers/analytical.controller");


// This route layer connects frontend → Node.js backend → FastAPI model

/**
 * @route   POST /api/analytical/start
 * @desc    Start analytical quiz (generate 12 validated questions)
 * @access  Private (requires user token)
 */
router.post("/start", analyticalController.startQuiz);

/**
 * @route   POST /api/analytical/submit
 * @desc    Submit user answer and fetch the next question
 * @access  Private
 */
router.post("/submit", analyticalController.submitAnswer);

/**
 * @route   POST /api/analytical/evaluate
 * @desc    Manually evaluate user’s analytical skill profile (optional)
 * @access  Private
 */
router.post("/evaluate", analyticalController.evaluateQuiz);

/**
 * @route   GET /api/analytical/sessions
 * @desc    Get active in-memory quiz sessions from FastAPI (for debugging / health check)
 * @access  Admin / Dev only
 */
router.get("/sessions", analyticalController.getActiveSessions);


module.exports = router;
