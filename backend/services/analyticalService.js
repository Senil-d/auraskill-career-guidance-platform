
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const MODEL_BASE_URL = process.env.MODEL_BASE_URL;


// Start Quiz — Generate 12 validated analytical questions

async function startQuiz(user_id, career, AL_stream, category, difficulty) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/start-quiz`, {
      user_id,
      career,
      AL_stream,
      category,
      difficulty,
    });
    return res.data;
  } catch (error) {
    console.error("startQuiz error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to start analytical quiz");
  }
}


//  Submit Answer — Store answer and get next question

async function submitAnswer(user_id, question_id, selected_answer, correct_answer, category) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/submit-answer`, {
      user_id,
      question_id,
      selected_answer,
      correct_answer,
      category,
    });
    return res.data;
  } catch (error) {
    console.error("submitAnswer error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to submit answer");
  }
}


//  Evaluate — Optional manual evaluation

async function evaluateQuiz(user_answers, correct_answers, question_metadata = {}) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/evaluate`, {
      user_answers,
      correct_answers,
      question_metadata,
    });
    return res.data;
  } catch (error) {
    console.error("evaluateQuiz error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to evaluate analytical quiz");
  }
}


// For debugging: Get current sessions

async function getActiveSessions() {
  try {
    const res = await axios.get(`${MODEL_BASE_URL}/`);
    return res.data;
  } catch (error) {
    console.error("getActiveSessions error:", error.response?.data || error.message);
    throw new Error("Failed to fetch active sessions");
  }
}

module.exports = {
  startQuiz,
  submitAnswer,
  evaluateQuiz,
  getActiveSessions,
};
