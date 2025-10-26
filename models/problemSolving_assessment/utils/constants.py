"""
constants.py
-----------------------------------
Shared constants and configuration used across the
Problem-Solving Adaptive Assessment Engine.

This file centralizes:
 - Career-to-category mappings
 - Difficulty levels
 - Dataset directory paths
 - System constants for quiz size, weighting, etc.

Author: AuraSkill Research Team (Senil)
Version: 1.0
"""

import os

# ------------------------------------------------------------
# 🧭 Base Paths
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

# ------------------------------------------------------------
# 🧩 Difficulty Levels
# ------------------------------------------------------------
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

# Probability or weighting for selection (used in adaptive generator)
DIFFICULTY_WEIGHTS = {
    "easy": 0.3,
    "medium": 0.5,
    "hard": 0.2,
}

# ------------------------------------------------------------
# 🎯 Global Quiz Settings
# ------------------------------------------------------------
TOTAL_QUESTIONS = 15                # Total per session
DEFAULT_START_DIFFICULTY = "medium" # Initial level
MAX_QUESTIONS_PER_SUBSKILL = 10     # From dataset structure
SESSION_EXPIRY_MINUTES = 30         # Optional, if adding cleanup timer

# ------------------------------------------------------------
# 🧠 Career → Category Mapping
# ------------------------------------------------------------
CAREER_CATEGORY_MAP = {
    "Development & Engineering": [
    "Software Engineer",
    "Web Developer",
    "Front-End Developer",
    "Back-End Developer",
    "Full-Stack Developer",
    "Mobile App Developer",
    "iOS Developer",
    "Android Developer",
    "Game Developer",
    "Embedded Systems Developer",
    "Firmware Engineer",
    "System Engineer",
    "DevOps Engineer",
    "Automation Engineer",
    "QA / Test Engineer",
    "AI Engineer",
    "ML Engineer",
    "Research Engineer",
    "AR/VR Developer",
    "Blockchain Developer"
  ],
    "Data & Analytics": [
    "Data Analyst",
    "Business Analyst",
    "Data Scientist",
    "Machine Learning Researcher",
    "ML Researcher",
    "AI Researcher",
    "Data Engineer",
    "BI (Business Intelligence) Developer",
    "Product Analyst",
    "Risk Analyst",
    "Operations Analyst",
    "Quantitative Analyst",
    "Statistician"
  ],
    "Networking & Infrastructure": [
    "Network Engineer",
    "Network Administrator",
    "System Administrator",
    "Cloud Engineer",
    "Cloud Technician",
    "Site Reliability Engineer (SRE)",
    "Infrastructure Engineer",
    "Platform Engineer",
    "Security Engineer",
    "Cybersecurity Analyst",
    "Security Operations Analyst",
    "IT Support Specialist",
    "Help Desk Technician",
    "DevOps / Cloud Ops Associate"
  ],
   "Design & Creativity": [
    "UI/UX Designer",
    "Product Designer",
    "UX Researcher",
    "Interaction Designer",
    "Visual Designer",
    "Graphic Designer",
    "Motion Designer",
    "Animator",
    "2D Artist",
    "3D Artist",
    "Video Editor",
    "Content Designer",
    "Creative Technologist",
    "Game UI/UX Designer"
  ],
    "Management & Leadership": [
    "Project Manager",
    "Program Manager",
    "Product Manager",
    "Technical Product Manager",
    "Team Lead",
    "Engineering Manager",
    "Scrum Master",
    "Agile Delivery Lead",
    "Operations Manager",
    "IT Manager",
    "CTO (Technical Leadership Track)",
    "Tech Lead / Lead Engineer"
  ]
}


# ------------------------------------------------------------
# 💡 Utility: Get Dataset Path for Category
# ------------------------------------------------------------
def get_dataset_path(category: str) -> str:
    """
    Constructs the file path for a given category's dataset.
    Example: "Data & Analytics" -> datasets/data_analytics_questions.json
    """
    file_name = f"{category.replace('&', 'and').replace(' ', '_').lower()}.json"
    return os.path.join(DATASET_DIR, file_name)


# ------------------------------------------------------------
# 🧪 Example Run
# ------------------------------------------------------------
# if __name__ == "__main__":
#     print("📁 Dataset directory:", DATASET_DIR)
#     print("🧠 Total Difficulty Levels:", DIFFICULTY_LEVELS)
#     print("✅ Example Path (Data & Analytics):", get_dataset_path("Data & Analytics"))
