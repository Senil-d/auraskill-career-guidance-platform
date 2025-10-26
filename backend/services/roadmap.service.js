import mongoose from "mongoose";
import Roadmap from "../models/roadmap.model.js";
const User = mongoose.model("User");
import { generateFullRoadmap } from "../utils/openaiRoadmapGenerator.js";
import { validateRoadmapOutput } from "../utils/validateRoadmapOutput.js";

/**
 * 🧠 generateRoadmap
 * -----------------------------------------------------------
 * Dynamically generates a skill roadmap using OpenAI.
 * Pulls user's current skill level and career from User model.
 * -----------------------------------------------------------
 */
export async function generateRoadmap(user_id, skill, required_level) {
  // Step 1️⃣ Load user context
  const user = await User.findById(user_id);
  if (!user) throw new Error("User not found.");

  const career = user.career || "General Career";
  const current_level = user.results?.get(skill)?.level || "Beginner";

  console.log(`🧭 Generating ${skill} roadmap for ${user.username}: ${current_level} → ${required_level} (${career})`);

  // Step 2️⃣ Generate roadmap with OpenAI
  const roadmapData = await generateFullRoadmap(career, skill, current_level, required_level);

  if (!roadmapData) {
    console.error("❌ OpenAI generation failed.");
    throw new Error("Unable to generate roadmap. Please try again.");
  }

  // Step 3️⃣ Validate roadmap structure
  const { valid, errors } = validateRoadmapOutput(roadmapData);
  if (!valid) {
    console.error("⚠️ Invalid roadmap structure:", errors);
    throw new Error("Generated roadmap did not pass validation.");
  }

  // Step 4️⃣ Prevent duplicates — remove previous roadmap for same skill
  await Roadmap.findOneAndDelete({ user_id, skill });

  // Step 5️⃣ Create new roadmap document
  const roadmap = new Roadmap({
    user_id: new mongoose.Types.ObjectId(user_id),
    career,
    skill,
    current_level,
    required_level,
    stages: roadmapData.stages,
    generated_by: "AI",
    generated_at: new Date(),
    ai_metadata: roadmapData.ai_metadata || {
      model: "gpt-4o-mini",
      temperature: 0.65,
    },
  });

  await roadmap.save();

  console.log(`✅ ${skill} roadmap saved for user ${user.username}`);
  return roadmap;
}

/**
 * 🔍 getUserRoadmaps
 * -----------------------------------------------------------
 * Fetch all roadmaps belonging to a user.
 */
export async function getUserRoadmaps(user_id) {
  const roadmaps = await Roadmap.find({ user_id }).sort({ created_at: -1 });
  return roadmaps;
}

/**
 * 🔍 getSingleRoadmap
 * -----------------------------------------------------------
 * Fetch one roadmap for a specific skill.
 */
export async function getSingleRoadmap(user_id, skill) {
  const roadmap = await Roadmap.findOne({ user_id, skill });
  if (!roadmap) throw new Error("No roadmap found for this skill.");
  return roadmap;
}

/**
 * 🔁 updateRoadmapProgress
 * -----------------------------------------------------------
 * Update per-stage progress flags (viewed, quiz_done).
 */
export async function updateRoadmapProgress(user_id, skill, stageIndex, updateData) {
  const roadmap = await Roadmap.findOne({ user_id, skill });
  if (!roadmap) throw new Error("Roadmap not found.");

  if (!roadmap.stages[stageIndex]) {
    throw new Error(`Stage ${stageIndex} not found in roadmap.`);
  }

  roadmap.stages[stageIndex].progress = {
    ...roadmap.stages[stageIndex].progress,
    ...updateData,
  };

  await roadmap.save();
  console.log(`📈 Updated ${skill} stage ${stageIndex} progress for ${user_id}`);
  return roadmap;
}
