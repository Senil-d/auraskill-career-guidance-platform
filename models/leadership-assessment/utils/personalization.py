from utils.constant import STREAM_CONTEXTS, STYLE_PREFIXES

def personalize_scenario(base, al_stream, career, decision_style):
    context = STREAM_CONTEXTS.get(al_stream, "team project")
    prefix = STYLE_PREFIXES.get(decision_style, "")
    return f"{prefix}{base.replace('project', context)} (as a {career})"
