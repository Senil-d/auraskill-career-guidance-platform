# utils/loader.py
import os
import json

BASE_PATH = "questions/"

def load_questions(career, trait, difficulty=None):
    """
    Load questions for a given career and trait.
    If difficulty is provided, filter by difficulty.
    Returns a list of matching questions.
    """
    file_name = f"{career.lower().replace(' ', '_')}.json"
    file_path = os.path.join(BASE_PATH, file_name)

    if not os.path.exists(file_path):
        return []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            questions = json.load(f)

        # Filter by trait and (optional) difficulty
        filtered = [q for q in questions if q["trait"] == trait]
        if difficulty:
            filtered = [q for q in filtered if q.get("difficulty") == difficulty]

        return filtered
    except Exception as e:
        print(f"Error loading questions for {career}-{trait}-{difficulty}: {e}")
        return []
