"""
data_loader.py
-----------------------------------
Utility functions for loading and validating
question dataset files used in the
Problem-Solving Adaptive Assessment Engine.

Handles:
 - Safe loading of JSON question files
 - Automatic path detection based on category
 - Validation of structure and required fields

Author: AuraSkill Research Team (Senil)
Version: 1.0
"""

import json
import os
from utils.constants import get_dataset_path

# ------------------------------------------------------------
# 📥 Load Category Dataset
# ------------------------------------------------------------
def load_category_file(category: str):
    """
    Loads the JSON question dataset for a given category.

    Args:
        category (str): e.g. "Data & Analytics", "Development & Engineering"

    Returns:
        list[dict]: List of valid question objects
    """
    file_path = get_dataset_path(category)

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ Dataset not found for category '{category}': {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"❌ Failed to parse JSON in {file_path}: {str(e)}")

    # Validate structure
    valid_data = validate_questions(data)
    if not valid_data:
        raise ValueError(f"⚠️ Dataset '{category}' is empty or invalid format.")

    return valid_data


# ------------------------------------------------------------
# 🔍 Validate Question Data Structure
# ------------------------------------------------------------
def validate_questions(data):
    """
    Validates that each question entry has the required fields.

    Required fields:
        id, category, sub_skill, difficulty, question, options, answer

    Args:
        data (list[dict])

    Returns:
        list[dict]: only valid question entries
    """
    required_fields = {"id", "category", "sub_skill", "difficulty", "question", "options", "answer"}
    valid_entries = []

    for q in data:
        if not isinstance(q, dict):
            continue
        if not required_fields.issubset(q.keys()):
            continue
        if not isinstance(q["options"], list) or len(q["options"]) < 2:
            continue
        valid_entries.append(q)

    return valid_entries


# ------------------------------------------------------------
# 🧩 Get All Available Categories (Utility)
# ------------------------------------------------------------
def list_available_categories(dataset_dir: str) -> list:
    """
    Lists all dataset JSON files in the dataset directory.

    Args:
        dataset_dir (str): path to datasets folder

    Returns:
        list[str]: available categories
    """
    categories = []
    for file in os.listdir(dataset_dir):
        if file.endswith("_questions.json"):
            categories.append(file.replace("_questions.json", "").replace("_", " ").title())
    return categories


# ------------------------------------------------------------
# 🧪 Example Usage
# ------------------------------------------------------------
# if __name__ == "__main__":
#     try:
#         category = "Data & Analytics"
#         questions = load_category_file(category)
#         print(f"✅ Loaded {len(questions)} questions for '{category}' category.")
#         print("Example Question:")
#         print({
#             "id": questions[0]["id"],
#             "sub_skill": questions[0]["sub_skill"],
#             "difficulty": questions[0]["difficulty"],
#             "question": questions[0]["question"]
#         })
#     except Exception as e:
#         print("Error:", e)
