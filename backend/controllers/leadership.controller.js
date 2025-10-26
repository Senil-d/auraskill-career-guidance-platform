const leadershipService = require('../services/leadershipServices');

// POST /api/leadership/start
const startSession = async (req, res) => {
  try {
    // You may want to extract these from req.body or req.user as needed
    const { al_stream, career, decision_style } = req.body;
    if (!al_stream || !career || !decision_style) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const response = await leadershipService.startSession(al_stream, career, decision_style);
    return res.status(200).json(response);
  } catch (err) {
    console.error('StartSession Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/leadership/answer
const submitAnswer = async (req, res) => {
  try {
    const { session_id, weights } = req.body;
    if (!session_id || !weights) {
      return res.status(400).json({ error: 'Missing session_id or weights' });
    }
    const response = await leadershipService.submitAnswer(session_id, weights);
    return res.status(200).json(response); // next question or quiz complete
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// GET /api/leadership/summary/:session_id
const getSummary = async (req, res) => {
  const session_id = req.params.session_id;

  try {
    // 1. Call the model backend to get result
    const resultData = await leadershipService.getSummary(session_id);

    // 2. Save result into MongoDB under 'results' field
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.results = {
      leadership: resultData.results  // You can also use other keys like "leadershipSkillResult"
    };

    await user.save();

    res.json({
      message: 'Result saved and fetched successfully',
      results: resultData.results,
    });

  } catch (error) {
    console.error("getSummary error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startSession,
  submitAnswer,
  getSummary,
};
