import sympy

def verify_math_expression(expression: str):
    """
    Tries to simplify a mathematical expression to check for validity.
    """
    try:
        expr = sympy.sympify(expression)
        return True if expr is not None else False
    except Exception:
        return False
