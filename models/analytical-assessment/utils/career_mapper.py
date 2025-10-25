import json, os, re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MAP_PATH = Path(__file__).parent / "career_category_map.json"
DEFAULT_CATEGORIES = ["data_interpretation", "pattern_recognition", "case_study"]

def load_career_mapping():
    if MAP_PATH.exists():
        try:
            with open(MAP_PATH, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def generate_dynamic_mapping(career: str):
    prompt = f"""
    You are an expert in analytical skill mapping.
    Given the career title "{career}", return the best matching categories
    from this list as JSON array:
    ["data_interpretation", "pattern_recognition", "case_study"]
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You map careers to analytical skill categories."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=60
        )

        raw_output = response.choices[0].message.content.strip()
        match = re.search(r"\[[\s\S]*\]", raw_output)
        categories = json.loads(match.group()) if match else DEFAULT_CATEGORIES

    except Exception as e:
        print(f"⚠️ LLM mapping error for '{career}': {e}")
        categories = DEFAULT_CATEGORIES

    mapping = load_career_mapping()
    mapping[career] = categories
    with open(MAP_PATH, "w") as f:
        json.dump(mapping, f, indent=2)

    return categories

def get_categories_for_career(career: str):
    mapping = load_career_mapping()
    if career in mapping:
        print(f"✅ Loaded cached mapping for career: {career}")
        return mapping[career]
    else:
        print(f"🤖 Generating new mapping for unseen career: {career}")
        return generate_dynamic_mapping(career)
