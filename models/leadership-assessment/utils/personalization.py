import os
from utils.constant import STREAM_CONTEXTS
import openai
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def personalize_scenario(base, al_stream, career):
    context = STREAM_CONTEXTS.get(al_stream, "team project")
    prompt = (
        f"Personalize the following scenario for a student in the '{al_stream}' stream "
        f"who is aspiring to be a '{career}'. The core meaning and challenge of the scenario must remain unchanged, "
        f"but the context and wording should reflect the stream and career. "
        f"Do not add extra instructions or commentary. Only return the personalized scenario.\n\n"
        f"Original scenario: {base}"
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at adapting educational scenarios to user backgrounds."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=120,
            temperature=0.4,
        )
        scenario = response.choices[0].message.content.strip()
        # If validation fails, fallback to basic personalization, but do not stop the quiz
        if not validate_personalization(base, scenario):
            scenario = f"{base.replace('project', context)} as a {career}"
        return scenario
    except Exception as e:
        # On error, fallback to basic personalization, but do not stop the quiz
        return f"{base.replace('project', context)} as a {career}"

def validate_personalization(original, personalized):
    import re
    # Extract keywords (nouns/verbs) from the original
    words = set(re.findall(r'\b\w+\b', original.lower()))
    stopwords = {"the", "a", "an", "to", "of", "and", "or", "in", "on", "for", "with", "as", "by", "at", "from", "is", "are", "was", "were", "be", "this", "that", "it", "you", "must"}
    keywords = words - stopwords
    personalized_words = set(re.findall(r'\b\w+\b', personalized.lower()))
    if not keywords:
        return True
    overlap = len(keywords & personalized_words) / len(keywords)
    return overlap >= 0.7
