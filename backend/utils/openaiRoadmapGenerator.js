import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: "./.env1" });

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function generateFullRoadmap(career, skill, current_level, required_level) {
  const prompt = `
You are an AI curriculum designer for Sri Lankan post–A/L students.

GOAL:
Generate a two-stage learning roadmap to improve the user's "${skill}" skills 
for their selected career: "${career}".

=========================
EDUCATIONAL FRAMEWORK (FOR YOUR INTERNAL REFERENCE)
=========================
Base your reasoning on the following five educational theories:
1️⃣ Bloom’s Taxonomy – Learning outcomes should progress from Understanding → Application → Analysis → Creation.
2️⃣ Formative Assessment Theory – Each stage includes 10 MCQs for self-reflection (no scoring).
3️⃣ Cognitive Apprenticeship – Always show both stages so learner can visualize mastery journey.
4️⃣ Zone of Proximal Development (Vygotsky) – Slightly challenge learner’s current capacity.
5️⃣ Mastery Learning Model – Ensure staged, measurable progression.

=========================
OUTPUT FORMAT (JSON ONLY)
=========================
{
  "skill": "${skill}",
  "career": "${career}",
  "stages": [
    {
      "stage_name": "Beginner → Intermediate",
      "relevance_status": "required | reference | completed",
      "description": "Why this stage matters for this career and skill area.",
      "knowledge_domains": [
        {
          "topic": "Concept name",
          "resources": ["Free global resource 1", "Free global resource 2"]
        }
      ],
      "expected_learning_outcomes": [
        "Start each outcome with Bloom's verbs (explain, apply, analyze)"
      ],
      "knowledge_check": {
        "instructions": "Answer 10 reflective MCQs to test your understanding.",
        "questions": [
          {
            "question": "Example question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A"
          }
        ]
      }
    },
    {
      "stage_name": "Intermediate → Advanced",
      "relevance_status": "required | reference | completed",
      "description": "Advanced skill development focus.",
      "knowledge_domains": [...],
      "expected_learning_outcomes": [...],
      "knowledge_check": {...}
    }
  ]
}

=========================
OUTPUT REQUIREMENTS
=========================
- Return **valid JSON only**, no text outside the JSON block.
- Always include both stages (even if one is “reference only”).
- Use globally accessible free resources (Coursera, Khan Academy, YouTube).
- MCQs must test understanding and application, not rote memory.
- Keep tone suitable for Sri Lankan post–A/L students.

Now generate the roadmap.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message?.content?.trim() || "";

    // Extract and parse JSON safely
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonText = raw.substring(jsonStart, jsonEnd + 1);

    let roadmap;
    try {
      roadmap = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("JSON parsing error in roadmap:", parseErr.message);
      console.log("Raw response preview:", raw.slice(0, 400));
      return null;
    }

    // Validate structure
    if (!roadmap?.stages || !Array.isArray(roadmap.stages)) {
      console.warn("Invalid roadmap format: missing stages array.");
      return null;
    }

    // Add metadata for DB traceability
    roadmap.generated_by = "AI";
    roadmap.generated_at = new Date();
    roadmap.ai_metadata = {
      model: "gpt-4o-mini",
      temperature: 0.65
    };

    return roadmap;
  } catch (error) {
    console.error("OpenAI roadmap generation failed:", error.message);
    return null;
  }
}
