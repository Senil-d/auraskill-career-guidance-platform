import statistics
from typing import List, Dict

# ------------------------------------------------------------
# 🎯 Main Evaluation Function
# ------------------------------------------------------------
def evaluate_quiz(responses: List[Dict]) -> Dict:

    if not responses:
        return {"error": "No responses provided for evaluation."}

    total_questions = len(responses)
    correct_answers = sum(1 for r in responses if r.get("selected") == r.get("answer"))

    # Overall Score (%)
    overall_score = round((correct_answers / total_questions) * 100, 2)

    # --------------------------------------------------------
    # 📊 Sub-skill Analysis
    # --------------------------------------------------------
    subskill_performance = {}
    for r in responses:
        sub = r.get("sub_skill", "Unknown")
        correct = r.get("selected") == r.get("answer")
        diff = r.get("difficulty", "medium")

        if sub not in subskill_performance:
            subskill_performance[sub] = {
                "total": 0,
                "correct": 0,
                "difficulties": []
            }

        subskill_performance[sub]["total"] += 1
        if correct:
            subskill_performance[sub]["correct"] += 1
        subskill_performance[sub]["difficulties"].append(diff)

    # Compute sub-skill scores & difficulty insights
    subskill_summary = {}
    for sub, stats in subskill_performance.items():
        score = round((stats["correct"] / stats["total"]) * 100, 2)
        # Find the most frequent difficulty reached
        mode_difficulty = _most_frequent(stats["difficulties"])
        subskill_summary[sub] = {
            "score": score,
            "questions_attempted": stats["total"],
            "max_difficulty_reached": _max_difficulty(stats["difficulties"]),
            "dominant_difficulty": mode_difficulty
        }

    # --------------------------------------------------------
    # 💡 Diagnostic Insights
    # --------------------------------------------------------
    strengths, improvements = _generate_feedback(subskill_summary)

    # --------------------------------------------------------
    # 🧾 Final Summary
    # --------------------------------------------------------
    result_summary = {
        "overall_score": overall_score,
        "total_questions": total_questions,
        "subskill_summary": subskill_summary,
        "strengths": strengths,
        "improvements": improvements,
    }

    return result_summary


# ------------------------------------------------------------
# 🧠 Helper: Most Frequent Item
# ------------------------------------------------------------
def _most_frequent(items: List[str]) -> str:
    if not items:
        return "medium"
    try:
        return statistics.mode(items)
    except statistics.StatisticsError:
        # If no unique mode exists
        return items[-1]


# ------------------------------------------------------------
# 🧩 Helper: Maximum Difficulty Achieved
# ------------------------------------------------------------
def _max_difficulty(difficulties: List[str]) -> str:
    """
    Returns the hardest level reached based on order of difficulty.
    """
    levels = ["easy", "medium", "hard"]
    highest = "easy"
    for d in difficulties:
        if levels.index(d) > levels.index(highest):
            highest = d
    return highest


# ------------------------------------------------------------
# 💬 Helper: Generate Personalized Feedback
# ------------------------------------------------------------
def _generate_feedback(subskill_summary: Dict) -> tuple[list[str], list[str]]:

    """
    Generate feedback statements based on sub-skill performance.
    """
    strengths, improvements = [], []
    for sub, data in subskill_summary.items():
        score = data["score"]
        if score >= 80:
            strengths.append(f"Strong in {sub} (performed well even at {data['max_difficulty_reached']} level).")
        elif 50 <= score < 80:
            strengths.append(f"Moderate skill in {sub}; consistent performance at {data['dominant_difficulty']} level.")
        else:
            improvements.append(f"Needs improvement in {sub} — struggled at {data['dominant_difficulty']} level.")
    return strengths, improvements


# ------------------------------------------------------------
# 🧪 Example Run
# ------------------------------------------------------------
# if __name__ == "__main__":
#     mock_responses = [
#         {"question_id": "DA_1", "sub_skill": "Data Interpretation", "difficulty": "medium", "selected": "80%", "answer": "80%"},
#         {"question_id": "DA_2", "sub_skill": "Data Interpretation", "difficulty": "hard", "selected": "70%", "answer": "80%"},
#         {"question_id": "DA_3", "sub_skill": "Critical Thinking", "difficulty": "medium", "selected": "B", "answer": "B"},
#         {"question_id": "DA_4", "sub_skill": "Statistics Reasoning", "difficulty": "easy", "selected": "C", "answer": "A"},
#         {"question_id": "DA_5", "sub_skill": "Statistics Reasoning", "difficulty": "medium", "selected": "A", "answer": "A"}
#     ]

#     result = evaluate_quiz(mock_responses)
#     print("🧾 Evaluation Summary:")
#     for k, v in result.items():
#         print(f"{k}: {v}")
