from utils.constant import TRAITS, TRAIT_LABELS
import json, random

def normalize_category(cat: str) -> str:
    if not cat:
        return ""
    c = str(cat).strip().lower()
    keywords = {
        "decision": "DM", "decide": "DM",
        "empathy": "EC", "empath": "EC", "communication": "EC",
        "conflict": "CM", "manage": "CM",
        "strategy": "ST", "strategic": "ST", "thinking": "ST",
    }
    for t in TRAITS:
        if c == t.lower(): return t
    for k, v in keywords.items():
        if k in c: return v
    return ""

def inverse_weight_probs(trait_scores):
    eps = 1e-6
    inv = [1.0 / (trait_scores[t] + eps) for t in TRAITS]
    total = sum(inv) or 1.0
    return [x / total for x in inv]

def feedback(overall, results):

    if overall >= 8:
        level = "Advanced"
        fb = "You exhibit strong leadership with excellent decision-making and empathy."
    elif overall >= 6:
        level = "Intermediate"
        fb = "You have balanced leadership traits; consider improving strategic foresight."
    else:
        level = "Beginner"
        fb = "Focus on conflict management and assertive communication."
    weak_trait = min(results, key=results.get)
    fb += f" Your weakest area appears to be {TRAIT_LABELS.get(weak_trait, weak_trait)}."
    return level, fb
