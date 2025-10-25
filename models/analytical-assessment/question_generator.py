import os
import json
import re
from typing import Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

# -----------------------------------------------------------
# 🔧 Configuration
# -----------------------------------------------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Allowed analytical categories and Bloom levels
ALLOWED_CATEGORIES = {"data_interpretation", "pattern_recognition", "case_study"}
BLOOM_HIGHER_ORDER = {"analyze", "evaluate", "create"}  # normalized lowercase


# -----------------------------------------------------------
# ⚙️ Difficulty → IRT Mapping Function
# -----------------------------------------------------------
def _map_difficulty_to_irt(difficulty: str) -> float:
    """
    Maps human-readable difficulty into an IRT-style numeric parameter.
    (0.0 = easy, 1.0 = hard)
    """
    d = difficulty.lower() if isinstance(difficulty, str) else ""
    if "easy" in d or d in ("1", "low"):
        return 0.2
    if "medium" in d or d in ("2", "moderate"):
        return 0.5
    return 0.8  # hard/default


# -----------------------------------------------------------
# 🧩 Theoretical Validation Layer
# -----------------------------------------------------------
def _theoretical_validate(item: Dict[str, Any], requested_category: str) -> None:
    """
    Validates generated question according to theoretical cognitive model:
    - Category ∈ allowed set
    - Bloom level ∈ higher-order (Analyze/Evaluate/Create)
    - Must not be recall-level
    - Correct answer ∈ options
    Raises ValueError if invalid.
    """
    category = (item.get("category") or "").lower()
    if category not in ALLOWED_CATEGORIES:
        raise ValueError(f"Invalid or unsupported category '{category}'. Allowed: {ALLOWED_CATEGORIES}")

    bloom = (item.get("bloom_level") or "").strip().lower()
    if bloom not in BLOOM_HIGHER_ORDER:
        raise ValueError(f"Question Bloom level '{bloom}' is not higher-order. Must be one of {BLOOM_HIGHER_ORDER}.")

    options = item.get("options")
    if not isinstance(options, list) or len(options) != 4 or not all(isinstance(o, str) and o.strip() for o in options):
        raise ValueError("Options must be a list of 4 non-empty strings (A–D).")

    correct = item.get("correct_answer")
    if not isinstance(correct, str) or correct.strip() not in options:
        raise ValueError("Correct answer must match one of the provided options exactly.")

    if not item.get("question") or not isinstance(item["question"], str):
        raise ValueError("Missing or invalid 'question' text.")

    if not item.get("explanation") or not isinstance(item["explanation"], str):
        raise ValueError("Missing or invalid 'explanation' text.")


# -----------------------------------------------------------
# 🧠 Question Generator Core
# -----------------------------------------------------------
def generate_question(career: str, stream: str, category: str, difficulty: str) -> Dict[str, Any]:
    """
    Generates a single analytical reasoning question targeting higher-order skills.
    Ensures question validity via theoretical validation and structure checks.
    Returns normalized dict or {'error': <reason>}.
    """

    # Normalize category
    category_lower = category.lower() if isinstance(category, str) else category
    if category_lower not in ALLOWED_CATEGORIES:
        return {"error": f"Category must be one of {ALLOWED_CATEGORIES}"}

    # Prompts for LLM
    system_prompt = (
        "You are an expert analytical reasoning question generator for career guidance assessments. "
        "You must produce higher-order analytical questions (Bloom's Analyze, Evaluate, or Create) "
        "and never recall or memory-based questions."
    )

    user_prompt = f"""
Generate ONE analytical reasoning multiple-choice question for a student from the "{stream}" A/L stream
preparing for a career as a "{career}".

Category: {category_lower}
Difficulty: {difficulty}

Requirements:
1. The question must assess analytical reasoning (Analyze, Evaluate, or Create level).
2. Provide exactly 4 options (A–D). Do NOT include labels like "A." inside the option text.
3. The correct answer must be one of the options (exact string match).
4. Include a brief explanation (1–3 sentences).
5. Include a Bloom taxonomy level ("Analyze", "Evaluate", or "Create").
6. Include an IRT difficulty estimate between 0.0 (easy) and 1.0 (hard).
7. Return strictly valid JSON (no markdown, commentary, or quotes).

JSON SCHEMA EXAMPLE:
{{
  "question": "string",
  "options": ["string","string","string","string"],
  "correct_answer": "string",
  "explanation": "string",
  "category": "{category_lower}",
  "bloom_level": "Analyze",
  "irt_difficulty": 0.6,
  "career_context": "{career}",
  "stream_context": "{stream}"
}}
"""

    # -----------------------------------------------------------
    # 🔄 LLM Call with Retry
    # -----------------------------------------------------------
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
                max_tokens=600
            )

            raw_output = response.choices[0].message.content.strip()
            match = re.search(r"\{[\s\S]*\}", raw_output)
            if not match:
                if attempt < 2:
                    continue
                return {"error": "No valid JSON found in LLM output."}

            try:
                item = json.loads(match.group())
            except json.JSONDecodeError as je:
                if attempt < 2:
                    continue
                return {"error": f"Failed to parse LLM JSON: {str(je)}"}

            # Normalize missing fields
            item.setdefault("category", category_lower)
            item.setdefault("career_context", career)
            item.setdefault("stream_context", stream)

            # Normalize difficulty
            if "irt_difficulty" not in item or not isinstance(item.get("irt_difficulty"), (int, float)):
                item["irt_difficulty"] = _map_difficulty_to_irt(difficulty)

            # Normalize Bloom capitalization
            if "bloom_level" in item and isinstance(item["bloom_level"], str):
                item["bloom_level"] = item["bloom_level"].strip().capitalize()

            # Validate theoretical correctness
            try:
                _theoretical_validate(item, category_lower)
            except ValueError as ve:
                return {"error": f"Theoretical validation failed: {str(ve)}"}

            # Return normalized schema
            normalized = {
                "question": item["question"].strip(),
                "options": [o.strip() for o in item["options"]],
                "correct_answer": item["correct_answer"].strip(),
                "explanation": item["explanation"].strip(),
                "category": item["category"],
                "bloom_level": item["bloom_level"],
                "irt_difficulty": float(item["irt_difficulty"]),
                "career_context": item["career_context"],
                "stream_context": item["stream_context"]
            }

            return normalized

        except Exception as e:
            if attempt == 2:
                return {"error": str(e)}

    # If all attempts failed
    return {"error": "Repeated generation attempts failed."}



