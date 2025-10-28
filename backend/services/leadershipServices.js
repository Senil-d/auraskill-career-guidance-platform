const axios = require('axios');
require('dotenv').config();

const MODEL_BASE_URL = process.env.MODEL_BASE_URL || 'http://localhost:8004';

// Start new session
async function startSession(al_stream, career) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/start`, {
      al_stream,
      career,
    });
    return res.data;
  } catch (error) {
    console.error('startSession error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to start session');
  }
}

// Submit answer and receive next question or result
async function submitAnswer(session_id, weights) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/answer`, {
      session_id,
      weights,
    });
    return res.data;
  } catch (error) {
    console.error('submitAnswer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to submit answer');
  }
}


module.exports = {
  startSession,
  submitAnswer,
};
