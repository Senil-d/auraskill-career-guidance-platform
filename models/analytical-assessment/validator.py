import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI
from utils.sympy_checker import verify_math_expression
from utils.bloom_classifier import classify_bloom_level

# -----------------------------------------------------------
# 🔧 Setup
# -----------------------------------------------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -----------------------------------------------------------
# 🧩 STRUCTURE VALIDATION
# -----------------------------------------------------------
def structure_validation(question_data: dict):
    """Validates that the generated question contains all required fields."""
    required_fields = ["question", "options", "correct_answer", "explanation"]

    for field in required_fields:
        if field not in question_data:
            raise ValueError(f"Missing required field: {field}")

    if not isinstance(question_data["options"], list) or len(question_data["options"]) != 4:
        raise ValueError("Question must include exactly 4 answer options.")

    for key in ["question", "correct_answer", "explanation"]:
        if not question_data[key] or not isinstance(question_data[key], str):
            raise ValueError(f"{key} cannot be empty or non-string.")

    return True


# -----------------------------------------------------------
# 🧠 LOGICAL VALIDATION (LLM verification)
# -----------------------------------------------------------
def logic_validation(question_data: dict):
    """Verifies if the provided answer logically follows from the question."""
    try:
        prompt = f"""
        Verify if the following analytical reasoning question and its correct answer are logically valid.

        Question: {question_data['question']}
        Options: {question_data['options']}
        Provided Answer: {question_data['correct_answer']}

        Reply strictly in JSON with:
        {{
            "is_valid": true/false,
            "reason": "string",
            "solution_steps": "string"
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a reasoning verifier that checks logical correctness of analytical questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300
        )

        result_text = response.choices[0].message.content.strip()

        # Extract valid JSON from model output
        json_match = re.search(r"\{[\s\S]*\}", result_text)
        if json_match:
            logic_result = json.loads(json_match.group())
        else:
            raise ValueError("Invalid JSON returned from LLM verifier.")

        if not logic_result.get("is_valid", False):
            raise ValueError(f"Logic check failed: {logic_result.get('reason', 'Unknown reason')}")

        question_data["logic_reason"] = logic_result.get("reason")
        question_data["solution_steps"] = logic_result.get("solution_steps")
        return True

    except Exception as e:
        question_data["logic_error"] = str(e)
        return False


# -----------------------------------------------------------
# 🎓 BLOOM’S LEVEL VALIDATION
# -----------------------------------------------------------
def bloom_validation(question_text: str):
    """Validates the Bloom’s Taxonomy level for the given question."""
    try:
        level = classify_bloom_level(question_text)
        if level not in ["Analyze", "Evaluate", "Create"]:
            raise ValueError(f"Question not aligned with analytical Bloom levels. Detected: {level}")
        return level
    except Exception as e:
        print(f"⚠️ Bloom validation failed: {e}")
        return None


# -----------------------------------------------------------
# 🧮 MATHEMATICAL VALIDATION
# -----------------------------------------------------------
def math_validation(question_text: str):
    """Symbolically verifies any mathematical expressions if detected."""
    try:
        if any(char.isdigit() for char in question_text):
            valid = verify_math_expression(question_text)
            if not valid:
                raise ValueError("Mathematical expression failed symbolic verification.")
        return True
    except Exception as e:
        print(f"⚠️ Math validation failed: {e}")
        return False


# -----------------------------------------------------------
# ✅ MASTER VALIDATOR FUNCTION
# -----------------------------------------------------------
def validate_question(question_data: dict):
    """
    Runs all validation layers sequentially.
    Invalid questions are marked as is_valid=False (not raised).
    """
    try:
        structure_validation(question_data)
    except Exception as e:
        question_data["is_valid"] = False
        question_data["validation_error"] = f"Structure error: {e}"
        return question_data

    # Run each layer safely
    logic_pass = logic_validation(question_data)
    math_pass = math_validation(question_data.get("question", ""))
    bloom_level = bloom_validation(question_data.get("question", ""))

    # Attach Bloom level
    if bloom_level:
        question_data["bloom_level"] = bloom_level

    # Determine overall validity
    if logic_pass and math_pass and bloom_level:
        question_data["is_valid"] = True
    else:
        question_data["is_valid"] = False
        question_data["validation_error"] = (
            question_data.get("logic_error")
            or "Math or Bloom validation failed."
        )

    return question_data
