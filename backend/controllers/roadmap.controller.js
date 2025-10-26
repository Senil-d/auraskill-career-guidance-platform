import {
  generateRoadmap,
  getUserRoadmaps,
  getSingleRoadmap,
  updateRoadmapProgress,
} from "../services/roadmap.service.js";

/**
 * 🧭 generateRoadmapController
 * -----------------------------------------------------------
 * Generates a personalized, theory-aligned skill roadmap using OpenAI
 * based on user's current skill level and career context.
 * -----------------------------------------------------------
 * @route   POST /api/roadmap/generate
 * @access  Private (JWT)
 */
export const generateRoadmapController = async (req, res) => {
  try {
    const { skill, required_level } = req.body;
    const user_id = req.user.id; // extracted by JWT middleware

    if (!skill || !required_level) {
      return res
        .status(400)
        .json({ success: false, message: "Skill and required_level are required." });
    }

    const roadmap = await generateRoadmap(user_id, skill, required_level);

    return res.status(201).json({
      success: true,
      message: `Roadmap for ${skill} generated successfully.`,
      roadmap,
    });
  } catch (error) {
    console.error("🚨 Error generating roadmap:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate roadmap.",
      error: error.message,
    });
  }
};

/**
 * 📋 getAllUserRoadmapsController
 * -----------------------------------------------------------
 * Fetches all roadmaps generated for the logged-in user.
 * -----------------------------------------------------------
 * @route   GET /api/roadmap
 * @access  Private (JWT)
 */
export const getAllUserRoadmapsController = async (req, res) => {
  try {
    const user_id = req.user.id;
    const roadmaps = await getUserRoadmaps(user_id);

    return res.status(200).json({
      success: true,
      count: roadmaps.length,
      roadmaps,
    });
  } catch (error) {
    console.error("🚨 Error fetching roadmaps:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve roadmaps.",
      error: error.message,
    });
  }
};

/**
 * 🔍 getSingleRoadmapController
 * -----------------------------------------------------------
 * Returns a single roadmap for a specific skill.
 * -----------------------------------------------------------
 * @route   GET /api/roadmap/:skill
 * @access  Private (JWT)
 */
export const getSingleRoadmapController = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { skill } = req.params;

    const roadmap = await getSingleRoadmap(user_id, skill);
    return res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("🚨 Error fetching single roadmap:", error.message);
    return res.status(404).json({
      success: false,
      message: error.message || "Roadmap not found.",
    });
  }
};

/**
 * 🔁 updateRoadmapProgressController
 * -----------------------------------------------------------
 * Updates per-stage roadmap progress (viewed/quiz_done) for the user.
 * -----------------------------------------------------------
 * @route   PATCH /api/roadmap/:skill/:stageIndex/progress
 * @access  Private (JWT)
 */
export const updateRoadmapProgressController = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { skill, stageIndex } = req.params;
    const { viewed, quiz_done } = req.body;

    const updateData = {};
    if (viewed !== undefined) updateData.viewed = viewed;
    if (quiz_done !== undefined) updateData.quiz_done = quiz_done;

    const updated = await updateRoadmapProgress(user_id, skill, stageIndex, updateData);

    return res.status(200).json({
      success: true,
      message: "Progress updated successfully.",
      roadmap: updated,
    });
  } catch (error) {
    console.error("🚨 Error updating roadmap progress:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update progress.",
      error: error.message,
    });
  }
};
