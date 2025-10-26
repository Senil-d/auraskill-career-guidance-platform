"""
session_manager.py — Adaptive Session Management
Aligned with unified question schema that uses "id" as primary key.
"""

import random
import uuid
from typing import Dict, List
from engine.difficulty_controller import get_initial_difficulty, update_difficulty

# ------------------------------------------------------------
# 🧠 In-memory session storage
# ------------------------------------------------------------
ACTIVE_SESSIONS: Dict[str, Dict] = {}


# ------------------------------------------------------------
# 🎬 Create new quiz session
# ------------------------------------------------------------
def create_session(user_id: str, questions: List[Dict]) -> Dict:
    session_id = str(uuid.uuid4())

    subskill_states = {}
    for q in questions:
        sub = q.get("sub_skill", "General")
        if sub not in subskill_states:
            subskill_states[sub] = {
                "current_difficulty": get_initial_difficulty(),
                "asked": [],
                "correct_count": 0,
                "attempted": 0,
            }

    session = {
        "session_id": session_id,
        "user_id": user_id,
        "questions": questions,
        "subskill_states": subskill_states,
        "answered": [],
        "completed": False,
    }

    ACTIVE_SESSIONS[session_id] = session
    return session


# ------------------------------------------------------------
# 🔄 Fetch next question
# ------------------------------------------------------------
def get_next_question(session_id: str) -> Dict:
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise ValueError("Invalid session ID")

    used_ids = [q["id"] for q in session["answered"]]
    remaining = [q for q in session["questions"] if q["id"] not in used_ids]

    if not remaining:
        session["completed"] = True
        return None

    random.shuffle(remaining)
    next_q = remaining[0]

    sub = next_q.get("sub_skill", "General")
    sub_state = session["subskill_states"][sub]
    sub_state["attempted"] += 1
    sub_state["asked"].append(next_q["id"])

    return next_q


# ------------------------------------------------------------
# 🧩 Record answer + update difficulty
# ------------------------------------------------------------
def record_answer(session_id: str, question_id: str, selected: str, correct: str, sub_skill: str, difficulty: str):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise ValueError("Session not found")

    was_correct = selected.strip().lower() == correct.strip().lower()
    sub_state = session["subskill_states"].get(sub_skill)

    if not sub_state:
        sub_state = {"current_difficulty": get_initial_difficulty(), "asked": [], "correct_count": 0, "attempted": 0}

    sub_state["attempted"] += 1
    if was_correct:
        sub_state["correct_count"] += 1

    new_diff = update_difficulty(difficulty, was_correct)
    sub_state["current_difficulty"] = new_diff
    session["subskill_states"][sub_skill] = sub_state

    # ✅ store answer record with "id"
    session["answered"].append({
        "id": question_id,
        "sub_skill": sub_skill,
        "difficulty": difficulty,
        "selected": selected,
        "answer": correct,
        "was_correct": was_correct,
    })

    ACTIVE_SESSIONS[session_id] = session
    return {"status": "recorded", "next_difficulty": new_diff}


# ------------------------------------------------------------
# 🧾 End session + get responses
# ------------------------------------------------------------
def close_session(session_id: str) -> Dict:
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise ValueError("Session not found")

    session["completed"] = True
    return {
        "user_id": session["user_id"],
        "session_id": session["session_id"],
        "responses": session["answered"],
        "subskill_states": session["subskill_states"]
    }


# ------------------------------------------------------------
# 🧹 Remove session
# ------------------------------------------------------------
def remove_session(session_id: str):
    if session_id in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[session_id]
        return {"status": "deleted"}
    return {"error": "Session not found"}
