const axios = require('axios');
require('dotenv').config();

const MODEL_BASE_URL = process.env.MODEL_BASE_URL || 'http://localhost:8004';

// Start new session
async function startSession(user_id, career) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/start`, { user_id, career });
    return res.data;
  } catch (error) {
    console.error('startSession error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to start session');
  }
}

// Submit user's answer to current question
async function submitAnswer(session_token, question_id, selected_index, user_order = null) {
  try {
    const payload = {
      session_token,
      question_id,
    };

    if (selected_index !== undefined) {
      payload.selected_index = selected_index;
    }

    if (user_order !== null) {
      payload.user_order = user_order;
    }

    const res = await axios.post(`${MODEL_BASE_URL}/submit-answer`, payload);
    return res.data;
  } catch (error) {
    console.error('submitAnswer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to submit answer');
  }
}

// Get result summary
async function getSummary(session_token) {
  try {
    const res = await axios.get(`${MODEL_BASE_URL}/summary/${session_token}`);
    return res.data;
  } catch (error) {
    console.error('getSummary error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch summary');
  }
}

module.exports = {
  startSession,
  submitAnswer,
  getSummary,
};
