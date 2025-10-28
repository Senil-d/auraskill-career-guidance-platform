from fastapi import FastAPI, Body
from logic.engine import SBREEngine
from uuid import uuid4

app = FastAPI(
    title="SBRE Leadership Engine",
    description="Adaptive Leadership Assessment API (Production Version)",
    version="3.0"
)

sessions = {}

# start a new adaptive leadership quiz session
@app.post("/start")
def start_session(data: dict = Body(...)):

    al_stream = data.get("al_stream")
    career = data.get("career")

    if not al_stream or not career:
        return {"error": "Missing required fields: al_stream or career"}

    total_questions = 12
    session_id = str(uuid4())

    # Initialize engine
    engine = SBREEngine(al_stream, career, total_questions)
    sessions[session_id] = engine

    # Return the first adaptive question
    first_question = engine.get_next_adaptive_question()
    return {
        "session_id": session_id,
        "first_question": first_question,
        "message": "Leadership assessment session started successfully"
    }


# submit answer weights and get next question or final results
@app.post("/answer")
def answer_and_next(data: dict = Body(...)):

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
        del sessions[session_id] 
        return {
            "results": results,
            "message": "Leadership assessment completed successfully"
        }

    next_question = engine.get_next_adaptive_question()
    if not next_question:
        results = engine.evaluate_final_results()
        del sessions[session_id]
        return {
            "results": results,
            "message": "Leadership assessment completed successfully"
        }

    return {"next_question": next_question}



