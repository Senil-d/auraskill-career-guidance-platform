const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const User = require("../models/userModel");

// Suggest careers based on A/L stream + specialization
exports.suggestCareer = async (req, res) => {
  try {
    // 1. Get user's AL_stream and specialization from DB
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const AL_stream = user.AL_stream;
    const specialization = user.specialization; 

    if (!AL_stream || !specialization) {
      return res
        .status(400)
        .json({ message: "Please complete profile with A/L stream and specialization" });
    }

    // Read CSV file
    const filePath = path.join(
      __dirname,
      "../data/RIASECdata.csv"
    );
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (
          row.AL_stream.toLowerCase() === AL_stream.toLowerCase() &&
          row.specialization.toLowerCase() === specialization.toLowerCase()
        ) {
          results.push({
            careers: row.career.split(",").map((c) => c.trim()),
            justification: row.Justification,
          });
        }
      })
      .on("end", () => {
        if (results.length === 0) {
          return res.status(404).json({
            message: `No career match found for ${AL_stream} + ${specialization}`,
          });
        }
        res.json({ suggestions: results });
      });
  } catch (error) {
    console.error("Career suggestion error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Save chosen career under user profile
exports.chooseCareer = async (req, res) => {
  try {
    const { chosenCareer } = req.body;
    if (!chosenCareer) {
      return res.status(400).json({ message: "Please provide chosenCareer" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.career = chosenCareer;
    await user.save();

    res.json({
      message: "Career choice saved successfully",
      career: user.career,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
