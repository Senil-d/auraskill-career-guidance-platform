const axios = require("axios");

// ✅ Local or production model URL
const MODEL_URL = process.env.PROBLEM_SOLVING_MODEL_URL || "http://127.0.0.1:8005";

exports.startQuiz = async (user_id, career) => {
  try {
    const payload = { user_id, career };
    console.log("🚀 [Service] Starting quiz with payload:", payload);

    const res = await axios.post(`${MODEL_URL}/generate`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  } catch (error) {
    console.error("❌ [Service] startQuiz error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to start quiz session");
  }
};

exports.submitAnswer = async (session_id, question) => {
  try {
    const payload = {
      session_id,
      question_id: question.id, // ✅ use "id" (matches FastAPI schema)
      selected: question.selected,
      correct: question.correct,
      sub_skill: question.sub_skill,
      difficulty: question.difficulty,
    };

    console.log("🟢 [Service] Submitting answer:", payload);

    const res = await axios.post(`${MODEL_URL}/answer`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  } catch (error) {
    console.error("❌ [Service] submitAnswer error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to submit answer");
  }
};
