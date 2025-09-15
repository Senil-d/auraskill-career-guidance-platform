const pythonService = require('../servivces/pythonService');

// POST /api/leadership/start
const startSession = async (req, res) => {
  try {
    const { user_id, career } = req.body;

    if (!user_id || !career) {
      return res.status(400).json({ error: 'Missing user_id or career' });
    }

    const response = await pythonService.startSession(user_id, career);
    return res.status(200).json(response); // includes session_token, current_trait, first_question
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/leadership/submit
const submitAnswer = async (req, res) => {
  try {
    const { session_token, question_id, selected_index, user_order } = req.body;

    if (!session_token || !question_id) {
      return res.status(400).json({ error: 'Missing session_token or question_id' });
    }

    const response = await pythonService.submitAnswer(session_token, question_id, selected_index, user_order);
    return res.status(200).json(response); // returns next question or completion status
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// GET /api/leadership/summary/:session_token
const getSummary = async (req, res) => {
  try {
    const { session_token } = req.params;

    if (!session_token) {
      return res.status(400).json({ error: 'Missing session_token' });
    }

    const response = await pythonService.getSummary(session_token);
    return res.status(200).json(response); // includes final result
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  startSession,
  submitAnswer,
  getSummary,
};
