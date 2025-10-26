const problemSolvingService = require("../services/problemSolvingService");
const User = require("../models/userModel");


exports.startQuizByUser = async (req, res) => {
  try {
    // 🧠 req.user comes from 'protect' middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }

    // ✅ Check that the user has a career assigned
    if (!user.career) {
      return res
        .status(400)
        .json({ error: "User does not have a career assigned yet" });
    }

    console.log("🚀 [Controller] Starting quiz using user career:", {
      user_id: user._id,
      career: user.career,
    });

    const data = await problemSolvingService.startQuiz(user._id, user.career);
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ [Controller] startQuizByUser error:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to start quiz using user career" });
  }
};


exports.startQuiz = async (req, res) => {
  try {
    // 🧠 `protect` middleware adds the authenticated user to `req.user`
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }

    if (!user.career) {
      return res
        .status(400)
        .json({ error: "User does not have a career assigned yet" });
    }

    console.log("🚀 [Controller] Starting Problem-Solving quiz for:", {
      user_id: user._id,
      career: user.career,
    });

    // ✅ Pass authenticated user_id directly
    const data = await problemSolvingService.startQuiz(user._id, user.career);

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ [Controller] startQuiz error:", error.message);
    res.status(500).json({
      error: error.message || "Failed to start problem-solving quiz",
    });
  }
};


exports.saveQuizResult = async (req, res) => {
  try {
    const user = req.user; // Provided by protect middleware
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }

    const { category, summary } = req.body;

    // Validate request payload
    if (!category || !summary) {
      return res.status(400).json({ error: "Missing category or summary" });
    }

    console.log("🧩 [Controller] Saving result for:", {
      user_id: user._id,
      category,
    });

    // Find latest user record from DB
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format the data according to resultSchema
    const resultData = {
      traits: summary.traits || summary.subskill_summary || {},
      overall_score: summary.overall_score || 0,
      level: summary.level || "Intermediate",
      feedback:
        summary.feedback ||
        "Continue improving in weaker sub-skills to reach the next level.",
    };

    // Save it under the given category (e.g., "problem_solving")
    dbUser.results.set(category, resultData);
    await dbUser.save();

    console.log(`✅ [Controller] ${category} result saved for ${dbUser.username}`);

    return res.status(200).json({
      message: `✅ ${category} result saved successfully`,
      results: dbUser.results,
    });
  } catch (error) {
    console.error("❌ [Controller] saveQuizResult error:", error.message);
    res.status(500).json({ error: "Failed to save quiz result" });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { session_id, id, selected, correct, sub_skill, difficulty } = req.body;

    // ✅ Validate incoming payload
    if (!session_id || !id) {
      return res
        .status(400)
        .json({ error: "Missing required fields: session_id or question id" });
    }

    console.log("🟢 [Controller] Submitting answer:", {
      session_id,
      id,
      selected,
      correct,
      sub_skill,
      difficulty,
    });

    // Construct clean payload for service
    const questionPayload = {
      id,
      selected,
      correct,
      sub_skill,
      difficulty,
    };

    const result = await problemSolvingService.submitAnswer(session_id, questionPayload);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ [Controller] submitAnswer error:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to submit answer" });
  }
};
