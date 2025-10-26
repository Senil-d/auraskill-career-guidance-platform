"""
difficulty_controller.py
-------------------------
This module controls adaptive difficulty adjustment for each sub-skill
during a user's problem-solving quiz session.

It ensures the quiz dynamically adjusts its challenge level based on
how well the user performs within the same session — without needing
past performance data.

Author: AuraSkill Research Team (Senil)
Version: 1.0
"""

# ------------------------------------------------------------
# 🔧 Difficulty Levels (Ordered)
# ------------------------------------------------------------
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]


# ------------------------------------------------------------
# 🎯 Get Initial Difficulty
# ------------------------------------------------------------
def get_initial_difficulty():
    """
    Returns the starting difficulty for any sub-skill when a new
    session begins.

    Typically starts at 'medium' for balanced progression.

    Returns:
        str: initial difficulty level
    """
    return "medium"


# ------------------------------------------------------------
# 📈 Update Difficulty Based on Answer Outcome
# ------------------------------------------------------------
def update_difficulty(previous_difficulty: str, was_correct: bool) -> str:
    """
    Determines the next difficulty level based on user's last response.

    Logic:
        ✅ If correct → move one step up (e.g., medium → hard)
        ❌ If incorrect → move one step down (e.g., medium → easy)

    Args:
        previous_difficulty (str): the difficulty of the last question
        was_correct (bool): True if the user answered correctly

    Returns:
        str: next difficulty level
    """
    if previous_difficulty not in DIFFICULTY_LEVELS:
        previous_difficulty = "medium"

    i = DIFFICULTY_LEVELS.index(previous_difficulty)

    # Increase difficulty if correct
    if was_correct and i < len(DIFFICULTY_LEVELS) - 1:
        return DIFFICULTY_LEVELS[i + 1]

    # Decrease difficulty if incorrect
    if not was_correct and i > 0:
        return DIFFICULTY_LEVELS[i - 1]

    # Stay the same if at boundary
    return previous_difficulty


# ------------------------------------------------------------
# 🧠 Helper: Get Numeric Weight for Difficulty
# ------------------------------------------------------------
def get_difficulty_weight(difficulty: str) -> float:
    """
    Returns a numeric weight used for probability scaling
    or semantic weighting in adaptive selection.

    Args:
        difficulty (str): 'easy', 'medium', or 'hard'

    Returns:
        float: weight value
    """
    weights = {"easy": 0.3, "medium": 0.5, "hard": 0.7}
    return weights.get(difficulty, 0.5)


# ------------------------------------------------------------
# 📊 Example Test
# ------------------------------------------------------------
# if __name__ == "__main__":
#     # Simulate a small adaptive path
#     print("Initial:", get_initial_difficulty())

#     diff = get_initial_difficulty()
#     answers = [True, True, False, False, True]

#     for a in answers:
#         diff = update_difficulty(diff, a)
#         print(f"Answer={a} → Next Difficulty: {diff}")
