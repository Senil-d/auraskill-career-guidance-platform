from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from question_generator import generate_question
from validator import validate_question
from evaluator import evaluate_answers
from utils.career_mapper import get_categories_for_career

import random
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# -----------------------------------------------------------
# 🧠 FastAPI Initialization
# -----------------------------------------------------------
app = FastAPI(
    title="Analytical Skill Assessment Model API",
    description="LLM-based analytical skill assessment system that pre-generates 12 validated questions.",
    version="3.0.0"
)

load_dotenv()

# -----------------------------------------------------------
# 🗂️ Temporary In-Memory Session Store
# -----------------------------------------------------------
# This keeps per-user quiz state. In production, use Redis or MongoDB.
sessions: Dict[str, Dict[str, Any]] = {}

# -----------------------------------------------------------
# 📦 Request Models
# -----------------------------------------------------------
class GenerationRequest(BaseModel):
    user_id: str
    career: str
    AL_stream: str
    category: Optional[str] = None
    difficulty: Optional[str] = None

class AnswerRequest(BaseModel):
    user_id: str
    question_id: str
    selected_answer: str
    correct_answer: str
    category: str

class EvaluationRequest(BaseModel):
    user_answers: Dict[str, Any]
    correct_answers: Dict[str, Any]
    question_metadata: Optional[Dict[str, Any]] = Field(default=None)

# -----------------------------------------------------------
# 🧩 Helper: Generate a single valid question
# -----------------------------------------------------------
def generate_single_valid_question(career: str, stream: str, category: Optional[str], difficulty: Optional[str]):
    """Generates and validates one analytical question, skipping invalid ones."""
    possible_categories = get_categories_for_career(career)
    category = category or random.choice(possible_categories)
    difficulty = difficulty or "medium"

    for _ in range(5):
        q = generate_question(career=career, stream=stream, category=category, difficulty=difficulty)
        if "error" in q:
            continue
        validated = validate_question(q)
        if validated.get("is_valid"):
            return validated
    raise ValueError("Failed to generate a valid analytical question after multiple attempts.")

# -----------------------------------------------------------
# 🚀 Step 1: Start Quiz — Pre-generate 12 validated questions
# -----------------------------------------------------------
@app.post("/start-quiz")
async def start_quiz(req: GenerationRequest):
    """
    Pre-generates 12 fully validated analytical questions for the user.
    Invalid questions are automatically skipped.
    """
    try:
        user_id = req.user_id
        possible_categories = get_categories_for_career(req.career)
        valid_questions = []
        attempts = 0

        while len(valid_questions) < 12 and attempts < 50:
            attempts += 1
            category = random.choice(possible_categories)
            difficulty = req.difficulty or "medium"

            question = generate_question(req.career, req.AL_stream, category, difficulty)
            if "error" in question:
                continue

            validated = validate_question(question)
            if validated.get("is_valid"):
                validated["id"] = f"Q{len(valid_questions)+1}"
                valid_questions.append(validated)

        if len(valid_questions) < 12:
            raise ValueError("Not enough valid questions generated after multiple attempts.")

        # Store session in memory
        sessions[user_id] = {
            "career": req.career,
            "AL_stream": req.AL_stream,
            "questions": valid_questions,
            "answers": []
        }

        print(f"✅ Generated {len(valid_questions)} validated questions for user {user_id} ({req.career})")

        return {
            "status": "ready",
            "message": f"12 validated questions generated successfully for {req.career}.",
            "question_count": len(valid_questions),
            "first_question": valid_questions[0],
            "remaining": 11
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz setup failed: {str(e)}")

# -----------------------------------------------------------
# 🚀 Step 2: Submit Answer and Get Next Question
# -----------------------------------------------------------
@app.post("/submit-answer")
async def submit_answer(req: AnswerRequest):
    """
    Stores user's answer and returns the next question.
    After 12 answers, evaluation is triggered and results returned.
    """
    try:
        user_id = req.user_id
        if user_id not in sessions:
            raise ValueError("No active quiz session found. Please start the quiz first.")

        session = sessions[user_id]
        session["answers"].append({
            "question_id": req.question_id,
            "selected": req.selected_answer,
            "correct": req.correct_answer,
            "category": req.category
        })

        answered = len(session["answers"])

        # ✅ All questions answered → Evaluate results
        if answered >= 12:
            user_answers = {a["question_id"]: a["selected"] for a in session["answers"]}
            correct_answers = {a["question_id"]: a["correct"] for a in session["answers"]}
            metadata = {a["question_id"]: {"category": a["category"]} for a in session["answers"]}
            result = evaluate_answers(user_answers, correct_answers, metadata)

            sessions.pop(user_id, None)

            return {
                "status": "completed",
                "message": "🎉 Quiz completed — here is your analytical skill summary.",
                "evaluation": result
            }

        # Otherwise → Return next question
        next_question = session["questions"][answered]
        return {
            "status": "next",
            "message": f"Answer recorded. {12 - answered} questions remaining.",
            "answered": answered,
            "next_question": next_question
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer submission failed: {str(e)}")

# -----------------------------------------------------------
# 🧮 Optional Direct Evaluation Endpoint (for batch tests)
# -----------------------------------------------------------
@app.post("/evaluate")
async def evaluate_user_answers(req: EvaluationRequest):
    """
    Evaluates user-submitted answers and returns analytical skill profile.
    """
    try:
        result = evaluate_answers(req.user_answers, req.correct_answers, req.question_metadata)
        return {"status": "success", "evaluation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

# -----------------------------------------------------------
# 🩺 Health Check
# -----------------------------------------------------------
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "✅ Analytical Skill Assessment Model API (preloaded 12-question mode) is running!",
        "version": "3.0.0",
        "routes": {
            "/start-quiz": "POST - Generate all 12 validated questions up front",
            "/submit-answer": "POST - Submit answer and fetch next question",
            "/evaluate": "POST - Evaluate user answers directly (for testing)"
        }
    }
