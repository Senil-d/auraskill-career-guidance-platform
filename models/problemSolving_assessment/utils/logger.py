import os
import datetime
import logging

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results", "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, f"engine_log_{datetime.date.today()}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("AdaptiveEngineLogger")

# ✅ make sure these exist exactly
def log_startup():
    logger.info("🚀 Problem-Solving Adaptive Engine initialized successfully.")

def log_generation_start(user_id: str, career: str):
    logger.info(f"🧠 Generating quiz for User: {user_id} | Career: {career}")

def log_question_selected(question_id: str, sub_skill: str, difficulty: str):
    logger.info(f"📘 Selected Question {question_id} | Sub-skill: {sub_skill} | Difficulty: {difficulty}")

def log_difficulty_update(sub_skill: str, previous: str, new: str, was_correct: bool):
    status = "✅ Correct" if was_correct else "❌ Incorrect"
    logger.info(f"{status} | {sub_skill}: Difficulty changed {previous} → {new}")

def log_session_created(session_id: str, user_id: str):
    logger.info(f"🧾 Session Created | ID: {session_id} | User: {user_id}")

def log_session_closed(session_id: str, total_responses: int):
    logger.info(f"📊 Session Closed | ID: {session_id} | Responses: {total_responses}")

def log_error(message: str):
    logger.error(f"❌ ERROR: {message}")

def log_warning(message: str):
    logger.warning(f"⚠️ WARNING: {message}")
