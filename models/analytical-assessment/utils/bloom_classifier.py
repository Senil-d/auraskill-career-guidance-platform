import openai
import os
from dotenv import load_dotenv
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def classify_bloom_level(question_text: str):
    """
    Classifies the question into a Bloom's Taxonomy cognitive level.
    """
    prompt = f"""
    Classify the following question according to Bloom's Taxonomy.
    Question: {question_text}

    Choose from: Remember, Understand, Apply, Analyze, Evaluate, Create.

    Reply only with the level name.
    """

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a Bloom's taxonomy classifier."},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=20
    )
#change
    return response.choices[0].message.content.strip()
