const axios = require('axios');
require('dotenv').config();

const MODEL_BASE_URL = process.env.MODEL_BASE_URL || 'http://localhost:8004';

// Start session
async function startSession(user_id, career) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/start`, { user_id, career });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to start session');
  }
}

// Submit answer
async function submitAnswer(session_token, question_id, selected_index, user_order = null) {
  try {
    const payload = {
      session_token,
      question_id,
    };

    // Only include one of them based on question type
    if (selected_index !== undefined) {
      payload.selected_index = selected_index;
    }
    if (user_order !== null) {
      payload.user_order = user_order;
    }

    const res = await axios.post(`${MODEL_BASE_URL}/submit-answer`, payload);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to submit answer');
  }
}

// Get summary
async function getSummary(session_token) {
  try {
    const res = await axios.get(`${MODEL_BASE_URL}/summary/${session_token}`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch summary');
  }
}

module.exports = {
  startSession,
  submitAnswer,
  getSummary,
};
