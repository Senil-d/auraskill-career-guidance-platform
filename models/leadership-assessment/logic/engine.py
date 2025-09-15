# logic/engine.py

import random
from utils.loader import load_questions


class Engine:
    def __init__(self):
        self.sessions = {}

    # ---------------------------
    # Start session and return first question
    # ---------------------------
    def start_session(self, user_id, career):
        print(f"[START_SESSION] Starting session for user: {user_id}, career: {career}")
        traits = ["communication", "adaptability", "decision-making", "delegation", "teamwork", "strategy"]
        session_token = f"{user_id}_{career.replace(' ', '')}_{random.randint(1000, 9999)}"

        # Initialize session progress
        progress = {}
        for trait in traits:
            progress[trait] = {
                "asked": 0,
                "correct": 0,
                "max": 0,
                "difficulty": 2,  # start medium
                "questions_seen": []
            }

        self.sessions[session_token] = {
            "user_id": user_id,
            "career": career,
            "traits": traits,
            "progress": progress,
            "current_trait_index": 0
        }

        # Immediately return first question
        first_question = self._get_next_question(session_token)
        return {
            "session_token": session_token,
            "current_trait": traits[0],
            "first_question": first_question
        }

    # ---------------------------
    # Internal: pick next question
    # ---------------------------
    def _get_next_question(self, session_token):
        session = self.sessions.get(session_token)
        if not session:
            print("[ERROR] Invalid session token")
            return {"error": "Invalid session token"}

        trait_index = session["current_trait_index"]
        if trait_index >= len(session["traits"]):
            print("[INFO] All traits completed")
            return {"completed": True}

        current_trait = session["traits"][trait_index]
        progress = session["progress"][current_trait]
        difficulty = progress["difficulty"]
        career = session["career"]

        print(f"[GET_QUESTION] Trait: {current_trait}, Difficulty: {difficulty}, Career: {career}")

        # Load questions at current difficulty
        questions = load_questions(career, current_trait, difficulty)
        questions = [q for q in questions if q["id"] not in progress["questions_seen"]]

        print(f"[DEBUG] Found {len(questions)} unseen questions at difficulty {difficulty}")

        # Fallback if no questions at this difficulty
        if not questions:
            for alt_diff in [1, 3]:
                alt_questions = load_questions(career, current_trait, alt_diff)
                alt_questions = [q for q in alt_questions if q["id"] not in progress["questions_seen"]]
                if alt_questions:
                    progress["difficulty"] = alt_diff
                    questions = alt_questions
                    print(f"[FALLBACK] Switching to difficulty {alt_diff}")
                    break

        if not questions:
            print(f"[INFO] No more questions for trait: {current_trait}, moving to next trait.")
            session["current_trait_index"] += 1
            if session["current_trait_index"] >= len(session["traits"]):
                return {"completed": True}
            return self._get_next_question(session_token)

        # Choose one randomly
        question = random.choice(questions)
        progress["questions_seen"].append(question["id"])
        print(f"[QUESTION SELECTED] ID: {question['id']}")

        return {
            "id": question["id"],
            "trait": current_trait,
            "career": career,
            "type": question.get("type", "msq"),
            "difficulty": progress["difficulty"],
            "question": question["question"],
            "options": question["options"]
        }

    # ---------------------------
    # Submit answer and return next question
    # ---------------------------
    def submit_answer(self, session_token, question_id, selected_index=None, user_order=None):
        session = self.sessions.get(session_token)
        if not session:
            return {"error": "Invalid session token"}

        trait_index = session["current_trait_index"]
        if trait_index >= len(session["traits"]):
            return {"completed": True}

        current_trait = session["traits"][trait_index]
        progress = session["progress"][current_trait]
        career = session["career"]
        difficulty = progress["difficulty"]

        # Reload question
        questions = load_questions(career, current_trait, difficulty)
        question = next((q for q in questions if q["id"] == question_id), None)
        if not question:
            return {"error": "Question not found"}

        score, max_score = 0, 3

        if question["type"] in ["msq", "roleplay", "timed"]:
            if selected_index is None or selected_index >= len(question["options"]):
                return {"error": "Invalid answer index"}
            score = question["scores"][selected_index]
            max_score = max(question["scores"])

        elif question["type"] == "drag_drop":
            if not user_order or not isinstance(user_order, list):
                return {"error": "Invalid drag_drop answer"}
            correct_order = question.get("correct_order", [])
            score = 3 if user_order == correct_order else 1
            max_score = 3

        # Update progress
        progress["asked"] += 1
        progress["correct"] += score
        progress["max"] += max_score

        # Adjust difficulty adaptively
        if score >= 2 and difficulty < 3:
            progress["difficulty"] += 1
        elif score <= 1 and difficulty > 1:
            progress["difficulty"] -= 1

        # Move to next trait if done
        if progress["asked"] >= 3:
            session["current_trait_index"] += 1
            if session["current_trait_index"] >= len(session["traits"]):
                return {"completed": True}

        return self._get_next_question(session_token)

    # ---------------------------
    # Final summary
    # ---------------------------
    def summary(self, session_token):
        session = self.sessions.get(session_token)
        if not session:
            return {"error": "Invalid session token"}

        trait_scores = {}
        total_score = 0

        for trait in session["traits"]:
            p = session["progress"][trait]
            norm_score = round((p["correct"] / p["max"]) * 10, 2) if p["max"] > 0 else 0

            if norm_score >= 7.0:
                level = "Advanced"
            elif norm_score >= 4.0:
                level = "Intermediate"
            else:
                level = "Beginner"

            trait_scores[trait] = {
                "raw": p["correct"],
                "max": p["max"],
                "score": norm_score,
                "level": level
            }
            total_score += norm_score

        overall = round(total_score / len(session["traits"]), 2)
        overall_level = "Advanced" if overall >= 7 else "Intermediate" if overall >= 4 else "Beginner"

        print(f"[SUMMARY] Token: {session_token}, Overall Score: {overall}, Level: {overall_level}")
        return {
            "skill_area": "leadership",
            "overall_score": overall,
            "level": overall_level,
            "trait_scores": trait_scores
        }
