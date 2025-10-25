"""
🔍 Analytical Skill Assessment Model Package
--------------------------------------------
This package powers the analytical reasoning component of the AuraSkill Career Guidance Platform.

Modules:
    app.py                - FastAPI entrypoint with /generate-question and /evaluate endpoints
    question_generator.py - LLM-based analytical question generator
    validator.py          - Multi-layer validation (structure, logic, Bloom’s taxonomy)
    evaluator.py          - User answer evaluation and skill profiling
    utils/                - Helper utilities (Bloom classifier, SymPy checker, difficulty estimator)
"""

# Import commonly used functions for easier package-level access
from .question_generator import generate_question
from .validator import validate_question
from .evaluator import evaluate_answers

# Expose public API
__all__ = [
    "generate_question",
    "validate_question",
    "evaluate_answers",
]


