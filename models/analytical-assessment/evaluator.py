import statistics
from typing import Dict, Any

# -----------------------------------------------------------
# 🧠 EVALUATION ENGINE
# -----------------------------------------------------------

def evaluate_answers(user_answers: Dict[str, str], correct_answers: Dict[str, Any], question_metadata: Dict[str, Any] = None):
    """
    Evaluates user-submitted answers against correct answers and produces a skill profile.

    Returns a dict containing:
      - category_scores: per-category scores (0–10)
      - overall_score: 0–10
      - level: Beginner|Intermediate|Advanced
      - completion_rate: percentage
      - strengths: list[str]
      - improvements: list[str]
      - feedback: summarized feedback string
    """
    if not user_answers or not correct_answers:
        raise ValueError("Missing answer data for evaluation.")

    total_questions = len(correct_answers) or 0
    if total_questions == 0:
        raise ValueError("No questions provided to evaluate.")

    answered_questions = len(user_answers)
    correct_count = 0

    # Category tallies for accuracy calculation
    category_tallies = {}
    for qid, correct_option in correct_answers.items():
        user_option = user_answers.get(qid)
        if user_option is None:
            continue  # skipped question

        is_correct = (str(user_option).strip().lower() == str(correct_option).strip().lower())
        if is_correct:
            correct_count += 1

        # Get category from metadata if available
        category = "unknown"
        if question_metadata and qid in question_metadata:
            category = question_metadata[qid].get("category", "unknown")

        if category not in category_tallies:
            category_tallies[category] = {"correct": 0, "total": 0}

        category_tallies[category]["total"] += 1
        if is_correct:
            category_tallies[category]["correct"] += 1

    # Normalize category accuracy (0–10 scale)
    category_scores: Dict[str, float] = {}
    for cat, tallies in category_tallies.items():
        if tallies["total"] > 0:
            ratio = tallies["correct"] / tallies["total"]
            category_scores[cat] = round(ratio * 10, 1)  # scale to 0–10 with 1 decimal
        else:
            category_scores[cat] = 0.0

    # Overall accuracy and completion
    accuracy_ratio = correct_count / total_questions if total_questions > 0 else 0.0
    overall_score = round(accuracy_ratio * 10, 2)  # 0–10
    completion_rate = round((answered_questions / total_questions) * 100, 2) if total_questions > 0 else 0.0

    # Level classification per spec
    if overall_score < 4.0:
        level = "Beginner"
    elif overall_score < 7.0:
        level = "Intermediate"
    else:
        level = "Advanced"

    # Generate qualitative feedback
    strengths, improvements, feedback_summary = generate_feedback(category_scores)

    return {
        "category_scores": category_scores,
        "overall_score": overall_score,
        "level": level,
        "completion_rate": completion_rate,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": feedback_summary
    }


# -----------------------------------------------------------
# 💡 FEEDBACK GENERATOR
# -----------------------------------------------------------
def generate_feedback(category_scores: Dict[str, float]):
    """
    Produces qualitative feedback from category performance.

    Returns (strengths, improvements, summary_string).
    - category_scores expected in 0–10 scale.
    """
    strengths = []
    improvements = []

    for category, score in category_scores.items():
        pretty_name = category.replace("_", " ").title()
        if score >= 8.0:
            strengths.append(f"Strong analytical ability in {pretty_name}.")
        elif score >= 5.0:
            strengths.append(f"Good reasoning in {pretty_name}; targeted practice can boost performance.")
            improvements.append(f"Practice time problems in {pretty_name} to improve speed and robustness.")
        else:
            improvements.append(f"Needs improvement in {pretty_name}; focus on problem decomposition and reasoning steps.")

    # Build concise feedback summary
    if strengths and not improvements:
        summary = f"Strong skills in {', '.join([s.split(' in ')[1].strip('.') for s in strengths])}."
    elif improvements and not strengths:
        summary = f"Requires improvement in {', '.join([i.split(' in ')[1].split(';')[0].strip('.') for i in improvements])}."
    else:
        top_strengths = ", ".join([s.split(' in ')[1].strip('.') for s in strengths[:3]]) if strengths else ""
        top_improv = ", ".join([i.split(' in ')[1].split(';')[0].strip('.') for i in improvements[:3]]) if improvements else ""
        parts = []
        if top_strengths:
            parts.append(f"Strong in {top_strengths}")
        if top_improv:
            parts.append(f"Improve: {top_improv}")
        summary = "; ".join(parts) if parts else "Balanced performance across categories."

    return strengths, improvements, summary
