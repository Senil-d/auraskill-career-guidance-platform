import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const generateQuiz = async (req, res) => {
  try {
    const { career } = req.body;
    if (!career) return res.status(400).json({ error: "Career is required" });

    const response = await axios.post(`${process.env.PS_MODEL_BASE_URL}/generate`, { career });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error generating quiz:", err.message);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

export const evaluateQuiz = async (req, res) => {
  try {
    const { questions, answers } = req.body;

    // 🔐 1️⃣ Extract user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 🧠 2️⃣ Evaluate quiz via FastAPI
    const response = await axios.post(`${process.env.PS_MODEL_BASE_URL}/evaluate`, { questions, answers });
    const resultData = response.data;

    // 🗂️ 3️⃣ Find user in DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🧾 4️⃣ Prepare the result object
    const quizResult = {
      traits: new Map(Object.entries(resultData.subskill_breakdown || {})),
      overall_score: resultData.overall_percentage || 0,
      level: resultData.skill_level || null,
      feedback: generateFeedback(resultData.skill_level),
    };

    // 🗃️ 5️⃣ Save result in user.results map under “problemSolving”
    user.results.set("problemSolving", quizResult);
    await user.save();

    // ✅ 6️⃣ Respond with both quiz result and updated user info
    res.json({
      message: "Evaluation complete & saved to user profile",
      userId,
      results: quizResult,
    });

  } catch (err) {
    console.error("❌ Error evaluating quiz:", err.message);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Failed to evaluate quiz" });
  }
};

// 🧠 Helper: basic feedback generator
function generateFeedback(level) {
  switch (level) {
    case "Beginner":
      return "You’re at the starting stage. Focus on improving your logic and analytical skills.";
    case "Intermediate":
      return "Good progress! Strengthen your weak areas to reach the advanced stage.";
    case "Advanced":
      return "Excellent! You demonstrate strong problem-solving skills.";
    default:
      return "Assessment complete.";
  }
}
