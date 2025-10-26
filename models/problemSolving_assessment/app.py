"""
app.py
-----------------------------------
FastAPI microservice for the
Problem-Solving Adaptive Assessment Engine.

Enhanced version:
 - Automatically fetches next question after user answers
 - Ends the assessment automatically and returns summary
 - Sends final results to Node backend for saving in MongoDB
 - Handles invalid sessions and missing fields gracefully
 - Provides detailed logs for debugging

Author: AuraSkill Research Team (Senil)
Version: 2.2
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import os
import requests

# ------------------------------------------------------------
# 🧠 Internal Imports
# ------------------------------------------------------------
from engine.question_generator import generate_quiz
from engine.evaluator import evaluate_quiz
from engine.session_manager import (
    create_session, get_next_question,
    record_answer, close_session
)
from utils.logger import (
    log_startup, log_generation_start, log_session_created,
    log_question_selected, log_difficulty_update, log_session_closed, log_error
)

# ------------------------------------------------------------
# ⚙️ Environment Config
# ------------------------------------------------------------
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://127.0.0.1:5000")
SAVE_RESULT_ENDPOINT = f"{NODE_BACKEND_URL}/api/problemsolving/save-result"

# ------------------------------------------------------------
# 🚀 Initialize FastAPI App
# ------------------------------------------------------------
app = FastAPI(
    title="AuraSkill - Problem Solving Adaptive Engine",
    version="2.2",
    description="Adaptive quiz generation and evaluation microservice with automatic next-question flow and result persistence.",
)

# ------------------------------------------------------------
# 🧭 Pydantic Models
# ------------------------------------------------------------
class QuizRequest(BaseModel):
    user_id: str
    career: str


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected: str
    correct: str
    sub_skill: str
    difficulty: str


# ------------------------------------------------------------
# 🧠 Root Endpoint
# ------------------------------------------------------------
@app.get("/")
def root():
    log_startup()
    return {
        "message": "🧠 AuraSkill Adaptive Engine is running with auto-flow enabled.",
        "version": "2.2"
    }


# ------------------------------------------------------------
# 🎯 Generate a New Quiz
# ------------------------------------------------------------
@app.post("/generate")
def generate_quiz_route(request: QuizRequest):
    """
    Generate a new adaptive quiz based on user career.
    """
    try:
        log_generation_start(request.user_id, request.career)
        questions = generate_quiz(career=request.career, user_id=request.user_id)

        if not questions or len(questions) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No questions found for career '{request.career}'"
            )

        # Create a new quiz session
        session = create_session(request.user_id, questions)
        log_session_created(session["session_id"], request.user_id)

        first_question = questions[0]
        return {
            "status": "success",
            "session_id": session["session_id"],
            "current_question": first_question,
            "total_questions": len(questions)
        }

    except HTTPException as e:
        log_error(str(e.detail))
        raise e
    except Exception as e:
        log_error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 🧩 Submit Answer → Auto Next or Auto End
# ------------------------------------------------------------
@app.post("/answer")
def submit_and_next(request: AnswerRequest):
    """
    User submits an answer → automatically:
      - Records it
      - Updates difficulty
      - Fetches next question
      - If quiz finished → evaluates and sends result to Node backend
    """
    try:
        print("🟢 Received Answer Request:", request.dict())

        # Record user's response
        result = record_answer(
            request.session_id,
            request.question_id,
            request.selected,
            request.correct,
            request.sub_skill,
            request.difficulty
        )

        if not result or "next_difficulty" not in result:
            raise ValueError("record_answer() did not return next_difficulty")

        log_difficulty_update(
            request.sub_skill,
            request.difficulty,
            result["next_difficulty"],
            request.selected.strip().lower() == request.correct.strip().lower()
        )

        # Try to fetch next question
        next_q = get_next_question(request.session_id)

        if next_q:
            log_question_selected(
                next_q["id"],
                next_q.get("sub_skill"),
                next_q.get("difficulty")
            )
            print("🟣 Next question:", next_q)
            return {
                "status": "in_progress",
                "message": "Next question generated.",
                "next_question": next_q
            }

        # 🧩 No questions left → close session and evaluate
        session_result = close_session(request.session_id)
        responses = session_result.get("responses", [])
        user_id = session_result.get("user_id")

        summary = evaluate_quiz(responses)
        log_session_closed(request.session_id, len(responses))
        print(f"✅ Quiz completed for session: {request.session_id}")

        # ------------------------------------------------------------
        # 📤 Send Result to Node Backend for Saving
        # ------------------------------------------------------------
        payload = {
            "category": "problem_solving",
            "summary": summary
        }

        try:
            response = requests.post(
                SAVE_RESULT_ENDPOINT,
                json=payload,
                headers={"Authorization": f"Bearer {session_result.get('token', '')}"}
            )

            if response.status_code == 200:
                print("✅ Result successfully sent to Node backend")
            else:
                print(f"⚠️ Failed to save result: {response.status_code}, {response.text}")

        except Exception as e:
            print("❌ Error sending result to Node backend:", e)

        # ------------------------------------------------------------
        # 🧾 Return result summary to frontend
        # ------------------------------------------------------------
        return {
            "status": "completed",
            "message": "✅ Assessment finished. Summary ready.",
            "summary": summary
        }

    except ValueError as e:
        log_error(str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 🧪 Local Run
# ------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AuraSkill Problem-Solving Adaptive Engine (Auto Mode)...")
    uvicorn.run("app:app", host="0.0.0.0", port=8005, reload=True)
