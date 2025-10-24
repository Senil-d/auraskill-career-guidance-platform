import random
from utils.constant import TRAITS
from utils.utils import inverse_weight_probs, feedback
from utils.loader import load_question_pool
from utils.personalization import personalize_scenario
import os

QUESTION_POOL_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "questions", "question_pool.json")

class SBREEngine:

    def get_next_adaptive_question(self):
        # If no questions asked yet, pick random trait
        if not self.asked_ids:
            trait = self.get_next_trait(first=True)
        else:
            # Find the lowest scoring trait
            min_score = min(self.trait_scores.values())
            weakest_traits = [t for t, v in self.trait_scores.items() if v == min_score]
            trait = random.choice(weakest_traits)
        q = self.select_question(trait)
        if q:
            q["scenario"] = personalize_scenario(q["scenario"], self.al_stream, self.career, self.decision_style)
        return q
    def __init__(self, al_stream, career, decision_style, total_questions=12):
        self.al_stream = al_stream
        self.career = career
        self.decision_style = decision_style
        self.total_questions = total_questions

        print(f"Loading questions from: {QUESTION_POOL_FILE}")
        self.questions = load_question_pool(QUESTION_POOL_FILE)
        print(f"Loaded {len(self.questions)} validated questions.")
        self.trait_scores = {t: 0.0 for t in TRAITS}
        self.asked_ids = set()

        # Group by trait
        self.by_trait = {t: [q for q in self.questions if q["trait"] == t] for t in TRAITS}
        self.per_trait_max = self._compute_per_trait_max()

    def get_next_trait(self, first=False):
        if first: return random.choice(TRAITS)
        probs = inverse_weight_probs(self.trait_scores)
        return random.choices(TRAITS, weights=probs, k=1)[0]

    def select_question(self, trait):
        pool = [q for q in self.by_trait.get(trait, []) if q["id"] not in self.asked_ids]
        if not pool: return None
        q = random.choice(pool)
        self.asked_ids.add(q["id"])
        return dict(q)

    def evaluate_response(self, weights):
        for t, v in weights.items():
            if t in self.trait_scores:
                self.trait_scores[t] += float(v)

    def generate_quiz(self):
        quiz = []
        for i in range(self.total_questions):
            trait = self.get_next_trait(first=(i == 0))
            q = self.select_question(trait)
            if not q: continue
            q["scenario"] = personalize_scenario(q["scenario"], self.al_stream, self.career, self.decision_style)
            quiz.append(q)
        return quiz

    def evaluate_final_results(self):
        results = {}
        for t in TRAITS:
            max_t = self.per_trait_max.get(t, 10 * self.total_questions)
            results[t] = round((self.trait_scores[t] / max_t) * 100, 2)
        overall = round(sum(results.values()) / len(TRAITS), 2)
        level, fb = feedback(overall, results)
        return {
            "decision_making": results["DM"],
            "empathy": results["EC"],
            "conflict_management": results["CM"],
            "strategic_thinking": results["ST"],
            "overall_score": overall,
            "leadership_level": level,
            "feedback": fb
        }

    def _compute_per_trait_max(self):
        per = {t: 0 for t in TRAITS}
        for q in self.questions:
            opts = q.get("options", [])
            max_per_trait = {t: 0 for t in TRAITS}
            for o in opts:
                w = o.get("weights", {})
                for t in TRAITS:
                    val = w.get(t, 0)
                    if val > max_per_trait[t]: max_per_trait[t] = val
            for t in TRAITS:
                per[t] += max_per_trait[t]
        return per
