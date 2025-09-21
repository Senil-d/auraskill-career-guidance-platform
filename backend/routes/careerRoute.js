const express = require("express");
const { suggestCareer, chooseCareer } = require("../controllers/careercontroller");
const {protect} = require("../middlewares/authMiddleware");

const router = express.Router();

// Get career suggestions based on AL_stream + specialization
router.post("/suggest", protect, suggestCareer);

// Save user’s chosen career
router.post("/choose", protect, chooseCareer);

module.exports = router;
