# ------------------------------------------------------------
# question_generator.py (final combined version)
# ------------------------------------------------------------
import json
import os
import random
from typing import Dict, List

# ------------------------------------------------------------
# 1️⃣ Career-to-Category Mapping
# ------------------------------------------------------------
CAREER_CATEGORY_MAP = {
    "Development & Engineering": [
        "Software Engineer", "Web Developer", "Mobile App Developer", "Game Developer", "System Engineer"
    ],
    "Data & Analytics": [
        "Data Analyst", "Business Analyst", "Statistician", "AI Engineer", "ML Researcher"
    ],
    "Networking & Infrastructure": [
        "Network Engineer", "System Administrator", "Cloud Technician", "Cybersecurity Analyst"
    ],
    "Design & Creativity": [
        "UI/UX Designer", "Graphic Designer", "Animator", "Video Editor"
    ],
    "Management & Leadership": [
        "Project Manager", "Team Lead", "Product Manager", "Operations Manager"
    ]
}
# ------------------------------------------------------------
# 2️⃣ Helper Functions
# ------------------------------------------------------------
def get_category_from_career(career: str) -> str:
    for category, careers in CAREER_CATEGORY_MAP.items():
        if career.strip().lower() in [c.lower() for c in careers]:
            return category
    return None

def load_category_file(category: str) -> List[Dict]:
    """
    Loads a single JSON file for the detected category.
    Example: questions/development_and_engineering.json
    """
    base_dir = os.path.join(os.path.dirname(__file__), "questions")
    file_map = {
        "Development & Engineering": "development_and_engineering.json",
        "Data & Analytics": "data_and_analytics.json",
        "Networking & Infrastructure": "networking_and_infrastructure.json",
        "Design & Creativity": "design_and_creativity.json",
        "Management & Leadership": "management_and_leadership.json"
    }

    file_name = file_map.get(category)
    if not file_name:
        raise ValueError(f"⚠️ No JSON file mapped for category: {category}")

    file_path = os.path.join(base_dir, file_name)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ File not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        print(f"📘 Loaded {len(data)} total questions from {file_name}")
        return data

def group_by_subskill(questions: List[Dict]) -> Dict[str, List[Dict]]:
    grouped = {}
    for q in questions:
        sub_skill = q.get("sub_skill", "Unknown")
        grouped.setdefault(sub_skill, []).append(q)
    return grouped

def select_random_questions(grouped_questions: Dict[str, List[Dict]], per_skill: int = 4) -> List[Dict]:
    selected = []
    for sub_skill, qs in grouped_questions.items():
        if len(qs) <= per_skill:
            chosen = qs
        else:
            chosen = random.sample(qs, per_skill)
        selected.extend(chosen)
    return selected


# ------------------------------------------------------------
# 3️⃣ Evaluate User Answers (merged here)
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# 4️⃣ CLI or Backend Mode
# ------------------------------------------------------------
if __name__ == "__main__":
    career_input = input("Enter career (e.g., Software Engineer): ").strip()
    category = get_category_from_career(career_input)

    if not category:
        print(f"❌ Career '{career_input}' not found in mapping.")
    else:
        print(f"\n🎯 Career: {career_input}")
        print(f"📂 Category: {category}")

        questions = load_category_file(category)
        grouped = group_by_subskill(questions)
        selected = select_random_questions(grouped, per_skill=4)

        print(f"\n🧠 {len(selected)} Random Questions Selected\n")

        user_answers = {}
        for q in selected:
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

        result = evaluate_answers(selected, user_answers)

        print("\n📊 Evaluation Summary")
        print(f"Total Questions: {result['total_questions']}")
        print(f"Correct Answers: {result['correct_answers']}")
        print(f"Overall Score: {result['overall_percentage']}%")
        print(f"Skill Level: {result['skill_level']}")
        print("\n🔍 Sub-Skill Breakdown:")
        for sub, score in result["subskill_breakdown"].items():
            print(f"  {sub}: {score}%")
