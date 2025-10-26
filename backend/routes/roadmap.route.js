const express = require("express");
const router = express.Router();

const {
  generateRoadmapController,
  getAllUserRoadmapsController,
  getSingleRoadmapController,
  updateRoadmapProgressController,
} = require("../controllers/roadmap.controller");

const { protect } = require("../middlewares/authMiddleware");

router.post("/generate", protect, generateRoadmapController);
router.get("/", protect, getAllUserRoadmapsController);
router.get("/:skill", protect, getSingleRoadmapController);
router.patch("/:skill/:stageIndex/progress", protect, updateRoadmapProgressController);

module.exports = router;
