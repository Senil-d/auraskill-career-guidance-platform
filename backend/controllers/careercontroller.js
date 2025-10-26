const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.suggestCareer = async (req, res) => {
  try {
    const { AL_stream, specialization } = req.body;

    if (!AL_stream || !specialization) {
      return res.status(400).json({
        message: "Please provide both A/L stream and specialization.",
      });
    }

    const filePath = path.join(__dirname, "../data/career_suggestion_json_ready.csv");
    const results = [];

    const normalize = (str) =>
      str?.toLowerCase().replace(/\s+/g, "").trim() || "";

    const userStream = normalize(AL_stream);
    const userSpec = normalize(specialization);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const stream = normalize(row["A/L Stream"]);
        const spec = normalize(row["Specialization"]);

        if (
          (stream.includes(userStream) || userStream.includes(stream)) &&
          (spec.includes(userSpec) || userSpec.includes(spec))
        ) {
          const rawCareers = row["Suggested Careers"];
          let careerList = [];

          try {
            // 🧠 Handles both JSON arrays and Python-style lists
            if (rawCareers.startsWith("[") && rawCareers.endsWith("]")) {
              const cleaned = rawCareers
                .replace(/'/g, '"')
                .replace(/\s*,\s*/g, ",")
                .trim();
              careerList = JSON.parse(cleaned);
            } else {
              careerList = rawCareers
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);
            }
          } catch (err) {
            console.error("⚠️ Error parsing careers:", err.message);
            careerList = rawCareers
              ? rawCareers.split(",").map((c) => c.trim()).filter(Boolean)
              : [];
          }

          results.push({
            careers: careerList,
            justification:
              row["Justification"] ||
              `Based on your A/L stream '${AL_stream}' and specialization '${specialization}', these career paths are recommended.`,
          });
        }
      })
      .on("end", () => {
        if (results.length === 0) {
          return res.status(404).json({
            message: `No career match found for ${AL_stream} + ${specialization}.`,
          });
        }

        res.status(200).json({ suggestions: results });
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
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filePath = path.join(__dirname, "../data/career_skill_data.csv");
    let matchedRow = null;

    // 🔹 Read CSV and find career
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          const careerName = (row.career || row.Career || "").trim().toLowerCase();
          if (careerName === chosenCareer.trim().toLowerCase()) {
            matchedRow = row;
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (!matchedRow) {
      return res.status(404).json({
        message: `Career '${chosenCareer}' not found in skill dataset`,
      });
    }

    // 🔹 Build skills object safely
    const parseSkill = (val) => {
      const num = parseInt(val);
      return isNaN(num) ? 0 : Math.max(0, Math.min(num, 100)); // clamp 0–100
    };

    const skills = {
      "Problem-Solving": parseSkill(matchedRow["Problem-Solving"]),
      "Analytical": parseSkill(matchedRow["Analytical"]),
      "Artistic": parseSkill(matchedRow["Artistic"]),
      "Leadership": parseSkill(matchedRow["Leadership"]),
    };

    // 🔹 Update user
    user.career = chosenCareer;
    user.requiredSkills = skills;
    user.skillJustification =
      matchedRow["Justification"] ||
      `Based on the selected career '${chosenCareer}', these skills are recommended.`;

    await user.save();

    // 🔹 Send clean response
    return res.json({
      message: "Career choice saved successfully with skill requirements ✅",
      career: user.career,
      requiredSkills: user.requiredSkills,
      justification: user.skillJustification,
    });
  } catch (error) {
    console.error("❌ Error in chooseCareer:", error);
    res.status(500).json({ message: error.message });
  }
};