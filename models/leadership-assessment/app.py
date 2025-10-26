from fastapi import FastAPI, Body
from logic.engine import SBREEngine
from uuid import uuid4

app = FastAPI(
    title="SBRE Leadership Engine",
    description="Adaptive Leadership Assessment API (Production Version)",
    version="3.0"
)

# Store all running quiz sessions in memory (temporary state)
sessions = {}

# ============================================================
# 1️⃣ Start a new quiz session
# ============================================================
@app.post("/start")
def start_session(data: dict = Body(...)):
    """
    Start a new adaptive leadership quiz session and return the first question.
    Body:
        {
            "al_stream": "Commerce",
            "career": "Project Manager",
            "decision_style": "Collaborative"
        }
    Returns:
        {
            "session_id": "uuid",
            "first_question": {...},
            "message": "Session started"
        }
    """
    al_stream = data.get("al_stream")
    career = data.get("career")
    decision_style = data.get("decision_style")

    if not al_stream or not career or not decision_style:
        return {"error": "Missing required fields: al_stream, career, or decision_style"}

    total_questions = 12
    session_id = str(uuid4())

    # Initialize engine
    engine = SBREEngine(al_stream, career, decision_style, total_questions)
    sessions[session_id] = engine

    # Return the first adaptive question
    first_question = engine.get_next_adaptive_question()
    return {
        "session_id": session_id,
        "first_question": first_question,
        "message": "Leadership assessment session started successfully"
    }


# ============================================================
# 2️⃣ Submit an answer and get next question or final results
# ============================================================
@app.post("/answer")
def answer_and_next(data: dict = Body(...)):
    """
    Submit user’s answer weights for the current question and return the next question.
    If the quiz is finished, return the final leadership results.
    Body:
        {
            "session_id": "uuid",
            "weights": {"DM": 8, "EC": 7, "CM": 6, "ST": 9}
        }
    Returns:
        - Next question (if quiz continues)
        - Final results (if quiz ends)
    """
    session_id = data.get("session_id")
    weights = data.get("weights", {})

    if not session_id or not weights:
        return {"error": "Missing session_id or weights"}

    engine = sessions.get(session_id)
    if not engine:
        return {"error": "Invalid or expired session_id"}

    # Update trait scores
    engine.evaluate_response(weights)

    # Check if quiz completed
    if len(engine.asked_ids) >= engine.total_questions:
        results = engine.evaluate_final_results()
        del sessions[session_id]  # Remove completed session from memory
        return {
            "results": results,
            "message": "Leadership assessment completed successfully"
        }

    # Otherwise, generate next adaptive question
    next_question = engine.get_next_adaptive_question()
    if not next_question:
        # Safety fallback (should rarely happen)
        results = engine.evaluate_final_results()
        del sessions[session_id]
        return {
            "results": results,
            "message": "Leadership assessment completed successfully"
        }

    return {"next_question": next_question}


# ============================================================
# ❌ 3️⃣ Remove /result endpoint (no longer used)
# ============================================================
# The Node.js backend now handles summary retrieval directly from MongoDB
