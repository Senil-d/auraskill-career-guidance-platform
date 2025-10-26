"""
semantic_weighting.py
-----------------------------------
This module calculates semantic relevance scores between a user's
selected career and available sub-skills in the question dataset.

It helps the adaptive quiz generator decide which sub-skills should
receive more questions (context-based weighting).

This is the "intelligence" layer that makes the quiz career-aware
even without any prior user data.

Author: AuraSkill Research Team (Senil)
Version: 1.0
"""

import re
import math
from typing import Dict, List
from utils.text_preprocessor import clean_text


# ------------------------------------------------------------
# 🧠 Extract Keywords
# ------------------------------------------------------------
def extract_keywords(text: str) -> List[str]:
    """
    Extracts simplified keywords from text by removing punctuation
    and splitting on whitespace.

    Args:
        text (str): Input string (career name or sub-skill name)

    Returns:
        List[str]: list of lowercase keywords
    """
    text = clean_text(text)
    return [word for word in text.split() if len(word) > 2]


# ------------------------------------------------------------
# ⚖️ Semantic Similarity Between Career and Sub-skill
# ------------------------------------------------------------
def compute_similarity(career_keywords: List[str], sub_keywords: List[str]) -> float:
    """
    Computes a semantic overlap score between two keyword sets.

    Scoring method:
        overlap_score = (shared_keywords^2) / (len(career_keywords) * len(sub_keywords))

    Args:
        career_keywords (List[str])
        sub_keywords (List[str])

    Returns:
        float: similarity score (0.0 – 1.0)
    """
    if not career_keywords or not sub_keywords:
        return 0.0

    shared = len(set(career_keywords) & set(sub_keywords))
    score = (shared ** 2) / (len(career_keywords) * len(sub_keywords))
    return round(score, 3)


# ------------------------------------------------------------
# 🎯 Compute Weighted Importance for Each Sub-skill
# ------------------------------------------------------------
def compute_subskill_weights(subskills: List[str], career: str) -> Dict[str, float]:
    """
    Calculates normalized weight distribution for all sub-skills
    relative to a user's chosen career.

    Args:
        subskills (List[str]): list of sub-skill names
        career (str): selected career title

    Returns:
        Dict[str, float]: normalized weights for each sub-skill
    """
    career_keywords = extract_keywords(career)
    raw_scores = {}

    for sub in subskills:
        sub_keywords = extract_keywords(sub)
        sim = compute_similarity(career_keywords, sub_keywords)
        # Give small base weight to avoid zeros
        raw_scores[sub] = sim + 0.1

    # Normalize to sum = 1
    total = sum(raw_scores.values()) or 1
    normalized = {k: round(v / total, 3) for k, v in raw_scores.items()}
    return normalized


# ------------------------------------------------------------
# 🔍 Optional Advanced Mode (TF-IDF style weighting)
# ------------------------------------------------------------
def compute_tfidf_weights(subskills: List[str], corpus_keywords: List[str]) -> Dict[str, float]:
    """
    (Optional extension) Calculates weights using simplified TF-IDF-like scaling.
    Useful for larger datasets or mixed career domains.

    Args:
        subskills (List[str]): sub-skill names
        corpus_keywords (List[str]): all keywords from dataset

    Returns:
        Dict[str, float]
    """
    total_docs = len(corpus_keywords)
    weights = {}
    for sub in subskills:
        freq = corpus_keywords.count(sub.lower())
        idf = math.log((total_docs + 1) / (freq + 1)) + 1
        weights[sub] = round(idf, 3)

    # Normalize
    total = sum(weights.values()) or 1
    normalized = {k: round(v / total, 3) for k, v in weights.items()}
    return normalized


# ------------------------------------------------------------
# 🧪 Example Usage
# ------------------------------------------------------------
# if __name__ == "__main__":
#     subskills = ["Data Interpretation", "Critical Thinking", "Statistics Reasoning"]
#     career = "Data Analyst"

#     weights = compute_subskill_weights(subskills, career)
#     print("Semantic Weights for:", career)
#     for k, v in weights.items():
#         print(f" - {k}: {v}")
