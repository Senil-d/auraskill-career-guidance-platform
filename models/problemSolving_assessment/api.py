import os
import sys
from fastapi import FastAPI, Request
import uvicorn

# ✅ ensure Python can find question_generator.py
sys.path.append(os.path.dirname(__file__))

from question_generator import (
    get_category_from_career,
    load_category_file,
    group_by_subskill,
    select_random_questions,
    evaluate_answers,
)

app = FastAPI(
    title="Problem Solving Assessment API",
    version="1.0",
    description="FastAPI microservice that serves quiz questions and evaluates results."
)

# ----------------------------
# Generate Quiz
# ----------------------------
@app.post("/generate")
async def generate_quiz(request: Request):
    data = await request.json()
    career = data.get("career")

    if not career:
        return {"error": "Career is required"}

    category = get_category_from_career(career)
    if not category:
        return {"error": f"No matching category found for '{career}'"}

    questions = load_category_file(category)
    grouped = group_by_subskill(questions)
    selected = select_random_questions(grouped, per_skill=4)

    return {
        "career": career,
        "category": category,
        "questions": selected
    }

# ----------------------------
# Evaluate Answers
# ----------------------------
@app.post("/evaluate")
async def evaluate_quiz(request: Request):
    data = await request.json()
    questions = data.get("questions", [])
    answers = data.get("answers", {})

    result = evaluate_answers(questions, answers)
    return result

# ----------------------------
# Run Server
# ----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)
