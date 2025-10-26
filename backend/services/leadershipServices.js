const axios = require('axios');
require('dotenv').config();

const MODEL_BASE_URL = process.env.MODEL_BASE_URL || 'http://localhost:8004';

// Start new session (expects al_stream, career, decision_style)
async function startSession(al_stream, career, decision_style) {
  try {
    const res = await axios.post(`${MODEL_BASE_URL}/start`, { al_stream, career, decision_style });
    return res.data;
  } catch (error) {
    console.error('startSession error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to start session');
  }
}

// Submit user's answer and get next question or result
// weights: { DM: number, EC: number, CM: number, ST: number }
async function submitAnswer(session_id, weights) {
  try {
    const payload = { session_id, weights };
    const res = await axios.post(`${MODEL_BASE_URL}/answer`, payload);
    return res.data;
  } catch (error) {
    console.error('submitAnswer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to submit answer');
  }
}

// Get result summary
async function getSummary(session_id) {
  try {
    const res = await axios.get(`${MODEL_BASE_URL}/result`, {
      params: { session_id }
    });

    if (!res.data || !res.data.results) {
      throw new Error('Model response does not contain expected results');
    }

    return res.data.results; // Return only the result block
  } catch (error) {
    console.error('getSummary error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch summary from model');
  }
}

module.exports = {
  startSession,
  submitAnswer,
  getSummary,
};
