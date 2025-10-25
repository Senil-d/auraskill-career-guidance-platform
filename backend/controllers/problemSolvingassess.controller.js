import axios from "axios";

export const generateQuiz = async (req, res) => {
  try {
    const { career } = req.body;
    if (!career) return res.status(400).json({ error: "Career is required" });

    const response = await axios.post(`${process.env.PS_MODEL_BASE_URL}/generate`, { career });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error generating quiz:", err.message);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

export const evaluateQuiz = async (req, res) => {
  try {
    const { questions, answers } = req.body;
    const response = await axios.post(`${process.env.PS_MODEL_BASE_URL}/evaluate`, { questions, answers });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error evaluating quiz:", err.message);
    res.status(500).json({ error: "Failed to evaluate quiz" });
  }
};
