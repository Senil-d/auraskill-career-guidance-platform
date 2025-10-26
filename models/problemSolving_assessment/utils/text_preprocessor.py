"""
text_preprocessor.py
-----------------------------------
This module handles text preprocessing for the
Problem-Solving Adaptive Assessment Engine.

Used primarily by:
 - semantic_weighting.py (for keyword extraction)
 - question_generator.py (for content normalization)

Performs:
 - lowercasing
 - punctuation and stopword removal
 - token normalization

Author: AuraSkill Research Team (Senil)
Version: 1.0
"""

import re
import string

# ------------------------------------------------------------
# 🧩 Basic Stopword List
# ------------------------------------------------------------
STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "for", "in", "on",
    "by", "with", "as", "from", "at", "this", "that", "is", "are",
    "was", "were", "be", "being", "been", "it", "its", "into", "using"
}

# ------------------------------------------------------------
# 🧹 Clean Raw Text
# ------------------------------------------------------------
def clean_text(text: str) -> str:
    """
    Cleans and normalizes text for semantic analysis.

    Steps:
      1. Lowercase conversion
      2. Remove punctuation
      3. Remove numbers
      4. Remove stopwords
      5. Trim whitespace

    Args:
        text (str): raw input text

    Returns:
        str: cleaned and normalized text
    """
    if not text or not isinstance(text, str):
        return ""

    # Lowercase
    text = text.lower()

    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))

    # Remove digits
    text = re.sub(r"\d+", "", text)

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Remove stopwords
    words = [word for word in text.split() if word not in STOPWORDS]

    return " ".join(words)


# ------------------------------------------------------------
# ✂️ Tokenize Cleaned Text
# ------------------------------------------------------------
def tokenize_text(text: str):
    """
    Splits cleaned text into tokens.

    Args:
        text (str): preprocessed text

    Returns:
        list[str]: token list
    """
    text = clean_text(text)
    return text.split()


# ------------------------------------------------------------
# 🧪 Example Usage
# ------------------------------------------------------------
# if __name__ == "__main__":
#     examples = [
#         "Data Interpretation and Critical Thinking",
#         "Understanding AI & ML in 2025!",
#         "The Role of Statistics in Analytics"
#     ]

#     for e in examples:
#         cleaned = clean_text(e)
#         tokens = tokenize_text(e)
#         print(f"Raw: {e}")
#         print(f"Cleaned: {cleaned}")
#         print(f"Tokens: {tokens}")
#         print("-" * 60)
