import statistics

# -----------------------------------------------------------
# ⚙️ DIFFICULTY ESTIMATOR
# -----------------------------------------------------------

def estimate_difficulty(ai_confidence: float = None, accuracy_rate: float = None, avg_time: float = None):
    """
    Estimates question difficulty based on available metrics.

    Args:
        ai_confidence (float): Model confidence (0–1 scale)
        accuracy_rate (float): % of users who answered correctly (0–1 scale)
        avg_time (float): Average time (in seconds) users take to answer

    Returns:
        dict: {
            "score": float (0–1),
            "label": "easy" | "medium" | "hard",
            "reason": str
        }
    """

    # Handle missing data gracefully
    weights = {
        "ai_confidence": 0.4,
        "accuracy_rate": 0.4,
        "avg_time": 0.2
    }

    # Normalize time → scaled 0–1 (assuming 10–60s reasonable range)
    normalized_time = 0.0
    if avg_time:
        normalized_time = min(max((avg_time - 10) / 50, 0), 1)  # 10s → 0.0, 60s → 1.0

    # Assign defaults if missing
    ai_conf = ai_confidence if ai_confidence is not None else 0.7
    accuracy = accuracy_rate if accuracy_rate is not None else 0.7

    # Compute weighted difficulty score
    difficulty_score = (
        (1 - ai_conf) * weights["ai_confidence"] +
        (1 - accuracy) * weights["accuracy_rate"] +
        normalized_time * weights["avg_time"]
    )

    # Convert to 0–1 scale
    difficulty_score = round(min(max(difficulty_score, 0.0), 1.0), 2)

    # Assign difficulty label
    if difficulty_score < 0.33:
        label = "easy"
    elif difficulty_score < 0.66:
        label = "medium"
    else:
        label = "hard"

    reason = (
        f"AI Confidence={ai_conf}, Accuracy={accuracy}, "
        f"Avg Time={avg_time or 'N/A'}s → Score={difficulty_score}"
    )

    return {
        "score": difficulty_score,
        "label": label,
        "reason": reason
    }

# -----------------------------------------------------------
# 🧮 ADAPTIVE DIFFICULTY UPDATER
# -----------------------------------------------------------

def update_user_difficulty(previous_difficulty: str, last_score: float):
    """
    Adjusts the next question difficulty based on user performance.

    Args:
        previous_difficulty (str): "easy" | "medium" | "hard"
        last_score (float): user's accuracy ratio (0–1)

    Returns:
        str: new difficulty level
    """

    if last_score >= 0.8:
        if previous_difficulty == "easy":
            return "medium"
        elif previous_difficulty == "medium":
            return "hard"
        else:
            return "hard"
    elif last_score < 0.5:
        if previous_difficulty == "hard":
            return "medium"
        elif previous_difficulty == "medium":
            return "easy"
        else:
            return "easy"
    else:
        return previous_difficulty
