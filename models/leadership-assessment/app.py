# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from logic.engine import Engine

app = FastAPI()
engine = Engine()

class StartSessionRequest(BaseModel):
    user_id: str
    career: str

class SubmitAnswerRequest(BaseModel):
    session_token: str
    question_id: str
    selected_index: Optional[int] = None
    user_order: Optional[List[int]] = None

@app.post("/start")
def start_session(data: StartSessionRequest):
    return engine.start_session(data.user_id, data.career)

@app.post("/submit-answer")
def submit_answer(data: SubmitAnswerRequest):
    result = engine.submit_answer(
        data.session_token, data.question_id,
        selected_index=data.selected_index,
        user_order=data.user_order
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/summary/{session_token}")
def get_summary(session_token: str):
    result = engine.summary(session_token)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
