import json
import os
import random
from typing import List, Dict
from engine.difficulty_controller import get_initial_difficulty
from utils.data_loader import load_category_file
from utils.constants import CAREER_CATEGORY_MAP

# ------------------------------------------------------------
# 🎯 Generate Adaptive Quiz
# ------------------------------------------------------------
def generate_quiz(career: str, user_id: str = None, total_questions: int = 15) -> List[Dict]:
    """
    Generates an adaptive quiz for a given career.

    Args:
        career (str): user's chosen career (e.g., 'Data Analyst')
        user_id (str, optional): unique ID for session tracking
        total_questions (int, optional): total number of questions to return

    Returns:
        List[Dict]: list of adaptive question objects
    """

    # --------------------------------------------------------
    # 1️⃣ Identify Main Category from Career
    # --------------------------------------------------------
    category = get_category_from_career(career)
    if not category:
        raise ValueError(f"No valid category found for career: {career}")

    # --------------------------------------------------------
    # 2️⃣ Load Question Pool
    # --------------------------------------------------------
    questions = load_category_file(category)
    if not questions:
        raise ValueError(f"No question data found for category: {category}")

    # --------------------------------------------------------
    # 3️⃣ Group Questions by Sub-skill
    # --------------------------------------------------------
    grouped = group_by_subskill(questions)
    if not grouped:
        raise ValueError(f"No sub-skills found in dataset for category: {category}")

    # --------------------------------------------------------
    # 4️⃣ Initialize Adaptive Selection
    # --------------------------------------------------------
    initial_difficulty = get_initial_difficulty()
    selected_questions = []

    # Dynamic weighting — assign more questions to sub-skills relevant to the career name
    weights = compute_subskill_weights(grouped, career)
    question_targets = allocate_question_targets(weights, total_questions)

    # --------------------------------------------------------
    # 5️⃣ Adaptive Question Sampling
    # --------------------------------------------------------
    for sub_skill, target_count in question_targets.items():
        pool = grouped[sub_skill]
        difficulty = initial_difficulty
        sampled = []

        # Ensure no duplicates, adapt difficulty pattern
        while len(sampled) < target_count and pool:
            available = [q for q in pool if q["difficulty"] == difficulty]
            if not available:
                # fallback if difficulty pool empty
                available = pool

            q = random.choice(available)
            pool.remove(q)
            sampled.append(q)

            # Randomly vary difficulty path
            difficulty = random.choice(["easy", "medium", "hard"])

        selected_questions.extend(sampled)

    # --------------------------------------------------------
    # 6️⃣ Shuffle Final Set
    # --------------------------------------------------------
    random.shuffle(selected_questions)

    # Limit total to required number
    return selected_questions[:total_questions]


# ------------------------------------------------------------
# 🔍 Get Category from Career
# ------------------------------------------------------------
def get_category_from_career(career: str) -> str:
    for category, careers in CAREER_CATEGORY_MAP.items():
        if career.lower().strip() in [c.lower() for c in careers]:
            return category
    return None


# ------------------------------------------------------------
# 🧩 Group Questions by Sub-skill
# ------------------------------------------------------------
def group_by_subskill(questions: List[Dict]) -> Dict[str, List[Dict]]:
    groups = {}
    for q in questions:
        sub = q.get("sub_skill", "General")
        groups.setdefault(sub, []).append(q)
    return groups


# ------------------------------------------------------------
# ⚖️ Compute Sub-skill Weights (Semantic Career Match)
# ------------------------------------------------------------
def compute_subskill_weights(grouped: Dict[str, List[Dict]], career: str) -> Dict[str, float]:
    """
    Approximates how relevant each sub-skill is to a career
    by checking overlap between sub-skill name and career keywords.

    (Light semantic version — no embeddings required)
    """
    base_keywords = career.lower().split()
    weights = {}

    for sub_skill in grouped.keys():
        score = 0
        for word in base_keywords:
            if word in sub_skill.lower():
                score += 1
        # default small base score
        weights[sub_skill] = max(score, 1)

    # Normalize weights
    total = sum(weights.values())
    normalized = {k: round(v / total, 2) for k, v in weights.items()}
    return normalized


# ------------------------------------------------------------
# 📊 Allocate Question Targets Based on Weights
# ------------------------------------------------------------
def allocate_question_targets(weights: Dict[str, float], total: int) -> Dict[str, int]:
    """
    Distributes total questions across sub-skills using
    proportional weighting.
    """
    targets = {}
    cumulative = 0

    for sub, weight in weights.items():
        n = int(total * weight)
        targets[sub] = n
        cumulative += n

    # Adjust rounding to reach total exactly
    while cumulative < total:
        for sub in list(weights.keys()):
            targets[sub] += 1
            cumulative += 1
            if cumulative >= total:
                break

    return targets


# ------------------------------------------------------------
# 🧪 Example Test
# ------------------------------------------------------------
# if __name__ == "__main__":
#     from pprint import pprint

#     test_career = "Data Analyst"
#     result = generate_quiz(career=test_career, user_id="12345")
#     pprint(result)
#     print(f"Total questions generated: {len(result)}")
