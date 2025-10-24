
from fastapi import FastAPI, Body, Query
from logic.engine import SBREEngine
from uuid import uuid4


app = FastAPI(
    title="SBRE Leadership Engine",
    description="Adaptive Leadership Assessment API (Production Version)",
    version="2.0"
)


# Store all running quiz sessions in memory (simple session state)
sessions = {}


# 1. Start a new session

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
    Returns: { session_id, first_question }
    """
    al_stream = data.get("al_stream")
    career = data.get("career")
    style = data.get("decision_style")
    total_questions = 12
    session_id = str(uuid4())
    engine = SBREEngine(al_stream, career, style, total_questions)
    sessions[session_id] = engine
    first_question = engine.get_next_adaptive_question()
    return {"session_id": session_id, "first_question": first_question, "message": "Session started"}



@app.post("/answer")
def answer_and_next(data: dict = Body(...)):
    """
    Submit answer weights for the current question and get the next question (or result if finished).
    Body:
      {
        "session_id": "uuid",
        "weights": {"DM": 8, "EC": 7, "CM": 6, "ST": 9}
      }
    Returns: { next_question } or { results }
    """
    session_id = data.get("session_id")
    weights = data.get("weights", {})
    engine = sessions.get(session_id)
    if not engine:
        return {"error": "Invalid or expired session_id"}
    # Update scores
    engine.evaluate_response(weights)
    # If finished, return results
    if len(engine.asked_ids) >= engine.total_questions:
        results = engine.evaluate_final_results()
        del sessions[session_id]
        return {
            "results": results,
            "message": "Leadership evaluation completed successfully"
        }
    # Otherwise, return next question
    q = engine.get_next_adaptive_question()
    if not q:
        results = engine.evaluate_final_results()
        del sessions[session_id]
        return {
            "results": results,
            "message": "Leadership evaluation completed successfully"
        }
    return {"next_question": q}
@app.get("/result")
def get_result(session_id: str = Query(...)):
    """
    End the quiz and return the final leadership evaluation report.
    Returns: { results, message }
    """
    engine = sessions.get(session_id)
    if not engine:
        return {"error": "Invalid or expired session_id"}
    results = engine.evaluate_final_results()
    del sessions[session_id]
    return {
        "results": results,
        "message": "Leadership evaluation completed successfully"
    }
