const User = require('../models/userModel');
const leadershipService = require('../services/leadershipServices');

// POST /api/leadership/start
const startSession = async (req, res) => {
  try {
    const { al_stream, career } = req.body;

    if (!al_stream || !career) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await leadershipService.startSession(al_stream, career);
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

    // If quiz completed, store the result in the database immediately
    if (response.results) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Map Python response to MongoDB schema
      const {
        decision_making = 0,
        empathy = 0,
        conflict_management = 0,
        strategic_thinking = 0,
        overall_score = 0,
        leadership_level = null,
        feedback = null,
      } = response.results;

      const traits = {
        decision_making,
        empathy,
        conflict_management,
        strategic_thinking,
      };

      user.currentSkills.set("leadership", {
        traits: new Map(Object.entries(traits)),
        overall_score,
        level: leadership_level,
        feedback,
      });
      await user.save();
    }

    return res.status(200).json(response); // Contains next question or final results
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// GET /api/leadership/summary
const getSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.currentSkills.has("leadership")) {
      return res.status(404).json({ message: "Leadership results not found" });
    }

    const results = user.currentSkills.get("leadership");
    res.json({
      message: "Leadership results fetched from database",
      results,
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
