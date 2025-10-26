
const analyticalService = require("../services/analyticalService");
//import userModel
const User = require("../models/userModel");


//  Start Analytical Quiz

exports.startQuiz = async (req, res) => {
  try {
    const { user_id, career, AL_stream, category, difficulty } = req.body;

    //  Validate inputs
    if (!career) {
      return res
        .status(400)
        .json({ error: "Missing Career — No career provided for quiz generation." });
    }

    const data = await analyticalService.startQuiz(
      user_id,
      career,
      AL_stream,
      category,
      difficulty
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("startQuiz controller error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


//  Submit Analytical Answer

// exports.submitAnswer = async (req, res) => {
//   try {
//     const { user_id, question_id, selected_answer, correct_answer, category } = req.body;

//     //  Validate required fields
//     if (!user_id || !question_id) {
//       return res
//         .status(400)
//         .json({ error: "Missing required fields (user_id or question_id)." });
//     }

//     const data = await analyticalService.submitAnswer(
//       user_id,
//       question_id,
//       selected_answer,
//       correct_answer,
//       category
//     );

//     res.status(200).json(data);
//   } catch (error) {
//     console.error("submitAnswer controller error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };


//  Submit Analytical Answer + Save Final Result to MongoDB

exports.submitAnswer = async (req, res) => {
  try {
    const { user_id, question_id, selected_answer, correct_answer, category } = req.body;

    // 🧩 Validate required fields
    if (!user_id || !question_id) {
      return res
        .status(400)
        .json({ error: "Missing required fields (user_id or question_id)." });
    }

    const data = await analyticalService.submitAnswer(
      user_id,
      question_id,
      selected_answer,
      correct_answer,
      category
    );

    //  When quiz is completed — save result in MongoDB
    if (data.status === "completed" && data.evaluation) {
      const evalData = data.evaluation;

      try {
        const user = await User.findById(user_id);
        if (!user) {
          console.warn("⚠️ User not found for ID:", user_id);
        } else {
          // Prepare analytical result object
          const analyticalResult = {
            traits: new Map(Object.entries(evalData.category_scores || {})),
            overall_score: evalData.overall_score || 0,
            level: evalData.level || "Unknown",
            feedback: evalData.feedback || "",
          };

          // Save inside user's results map
          user.results.set("analytical", analyticalResult);
          await user.save();

          console.log(`✅ Analytical results saved for user ${user.username}`);
        }
      } catch (dbError) {
        console.error("❌ Error saving analytical result:", dbError.message);
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("submitAnswer controller error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


//  Manual Evaluation Endpoint

exports.evaluateQuiz = async (req, res) => {
  try {
    const { user_answers, correct_answers, question_metadata } = req.body;

    const data = await analyticalService.evaluateQuiz(
      user_answers,
      correct_answers,
      question_metadata
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("evaluateQuiz controller error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


//  Get Active Sessions (for debugging / health check)

exports.getActiveSessions = async (req, res) => {
  try {
    const data = await analyticalService.getActiveSessions();
    res.status(200).json(data);
  } catch (error) {
    console.error("getActiveSessions controller error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
