import json, os
from utils.utils import normalize_category

def load_question_pool(file_path: str):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        return []
    except Exception as e:
        print(json.dumps({"error": f"Failed to load question pool: {str(e)}"}))
        return []

    validated, seen = [], set()
    trait_codes = {"DM", "EC", "CM", "ST"}
    for idx, q in enumerate(raw if isinstance(raw, list) else []):
        qid = q.get("id") or q.get("Id")
        if not qid:
            print(f"Question {idx}: Missing 'id'. Skipped.")
            continue
        if qid in seen:
            print(f"Question {idx}: Duplicate id '{qid}'. Skipped.")
            continue
        seen.add(qid)
        trait = normalize_category(q.get("category") or q.get("trait") or "")
        if not trait or trait not in trait_codes:
            print(f"Question {idx} (id={qid}): Invalid or missing 'category/trait'. Skipped.")
            continue
        scenario = q.get("scenario", "")
        if not scenario:
            print(f"Question {idx} (id={qid}): Missing 'scenario'. Skipped.")
            continue
        options = q.get("options", [])
        if not isinstance(options, list) or len(options) != 4:
            print(f"Question {idx} (id={qid}): 'options' must be a list of 4. Skipped.")
            continue
        valid_options = True
        for opt_idx, opt in enumerate(options):
            if not isinstance(opt, dict):
                print(f"Question {idx} (id={qid}): Option {opt_idx} is not a dict. Skipped.")
                valid_options = False
                break
            if "text" not in opt or not opt["text"]:
                print(f"Question {idx} (id={qid}): Option {opt_idx} missing 'text'. Skipped.")
                valid_options = False
                break
            weights = opt.get("weights", {})
            if not isinstance(weights, dict) or not any(k in trait_codes for k in weights):
                print(f"Question {idx} (id={qid}): Option {opt_idx} 'weights' missing trait codes. Skipped.")
                valid_options = False
                break
            for k, v in weights.items():
                if k in trait_codes and not isinstance(v, (int, float)):
                    print(f"Question {idx} (id={qid}): Option {opt_idx} weight '{k}' is not numeric. Skipped.")
                    valid_options = False
                    break
            if not valid_options:
                break
        if not valid_options:
            continue
        validated.append({
            "id": qid,
            "scenario": scenario,
            "trait": trait,
            "options": options
        })
    print(f"Validated {len(validated)} questions out of {len(raw) if isinstance(raw, list) else 0}.")
    return validated
