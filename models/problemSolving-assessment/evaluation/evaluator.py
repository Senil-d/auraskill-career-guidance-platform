import json
import os
from typing import Dict, List
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "generate_questions")))
from question_generator import load_category_file, group_by_subskill, select_random_questions

# ----------------------------------------------------------
# 1️⃣ Load Questions for a Category (Reuse from Generator)
# ----------------------------------------------------------
def load_questions(category: str) -> List[Dict]:
    """Loads all questions for a specific category using question_generator logic."""
    return load_category_file(category)


# ----------------------------------------------------------
# 2️⃣ Evaluate User Answers
# ----------------------------------------------------------
def evaluate_answers(questions: List[Dict], user_answers: Dict[str, str]) -> Dict:
    total_questions = len(questions)
    correct_count = 0
    subskill_scores = {}

    for q in questions:
        qid = q["id"]
        correct_answer = q.get("answer")
        sub_skill = q.get("sub_skill", "Unknown")
        user_choice = user_answers.get(qid)

        if sub_skill not in subskill_scores:
            subskill_scores[sub_skill] = {"correct": 0, "total": 0}

        subskill_scores[sub_skill]["total"] += 1

        if user_choice and user_choice.strip().lower() == correct_answer.strip().lower():
            correct_count += 1
            subskill_scores[sub_skill]["correct"] += 1

    # Compute sub-skill percentages
    subskill_percentages = {
        sub: round((val["correct"] / val["total"]) * 100, 2)
        for sub, val in subskill_scores.items()
    }

    overall_percentage = round((correct_count / total_questions) * 100, 2)
    skill_level = (
        "Beginner" if overall_percentage < 50
        else "Intermediate" if overall_percentage < 80
        else "Advanced"
    )

    return {
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "overall_percentage": overall_percentage,
        "skill_level": skill_level,
        "subskill_breakdown": subskill_percentages
    }


# ----------------------------------------------------------
# 3️⃣ CLI Demo for Testing
# ----------------------------------------------------------
if __name__ == "__main__":
    import random

    category = input("Enter category (e.g., Development & Engineering): ").strip()
    all_questions = load_questions(category)

    grouped = group_by_subskill(all_questions)
    selected_questions = select_random_questions(grouped, per_skill=4)

    print(f"\n🧠 {len(selected_questions)} Random Questions Selected\n")

    user_answers = {}

    for q in selected_questions:
        print(f"Q: {q['question']}")
        for i, opt in enumerate(q['options'], start=1):
            print(f"  {i}. {opt}")
        ans = input("Your answer: ").strip()
        try:
            idx = int(ans) - 1
            if 0 <= idx < len(q["options"]):
                user_answers[q["id"]] = q["options"][idx]
            else:
                user_answers[q["id"]] = ans
        except:
            user_answers[q["id"]] = ans
        print()

    result = evaluate_answers(selected_questions, user_answers)

    print("\n📊 Evaluation Summary")
    print(f"Total Questions: {result['total_questions']}")
    print(f"Correct Answers: {result['correct_answers']}")
    print(f"Overall Score: {result['overall_percentage']}%")
    print(f"Skill Level: {result['skill_level']}")
    print("\n🔍 Sub-Skill Breakdown:")
    for sub, score in result["subskill_breakdown"].items():
        print(f"  {sub}: {score}%")
