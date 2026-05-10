"""
MathVision — Python Symbolic Solver Microservice.
Exposes POST /solve. Used by the Node backend (services/python.service.ts).
"""
from fastapi import FastAPI
from pydantic import BaseModel
from sympy import symbols, sympify, integrate, diff, solve, latex, simplify, Eq
from sympy.parsing.latex import parse_latex

app = FastAPI(title="MathVision Solver", version="0.1.0")

class SolveRequest(BaseModel):
    latex: str
    equationType: str = "unknown"

class SolveResponse(BaseModel):
    ok: bool
    resultLatex: str = ""
    steps: list[str] = []
    error: str | None = None

x, y, t = symbols("x y t")

@app.get("/health")
def health():
    return {"ok": True, "service": "mathvision-python-solver"}

@app.post("/solve", response_model=SolveResponse)
def solve_endpoint(req: SolveRequest):
    try:
        expr = parse_latex(req.latex)
    except Exception as e:
        return SolveResponse(ok=False, error=f"parse error: {e}")

    try:
        steps: list[str] = [latex(expr)]
        if req.equationType == "integral":
            result = integrate(expr, x)
        elif req.equationType in ("derivative",):
            result = diff(expr, x)
        elif req.equationType in ("algebraic", "quadratic"):
            if isinstance(expr, Eq):
                # For equations like x^2 - 5x + 6 = 0
                steps = [latex(expr)]  # Original equation
                result = solve(expr, x)
                # Try to show factored form for quadratics
                if len(result) == 2 and all(isinstance(r, (int, float)) for r in result):
                    # If we have two numeric roots, show factored form
                    r1, r2 = result[0], result[1]
                    if r1 != r2:  # Distinct roots
                        factored = f"(x - {r1})(x - {r2}) = 0"
                        steps.append(factored)
                        steps.extend([f"x = {r1}", f"x = {r2}"])
                    else:
                        steps.append(f"x = {r1}")
                else:
                    steps.extend([f"x = {latex(r)}" for r in result])
            else:
                result = solve(Eq(expr, 0), x)
                steps.append(f"x = {latex(result[0]) if result else 'no solution'}")
        elif req.equationType == "trigonometric":
            result = simplify(expr)
        else:
            result = simplify(expr)

        # Only append final result if we haven't already built detailed steps
        if req.equationType not in ("algebraic", "quadratic"):
            steps.append(latex(result))
        return SolveResponse(ok=True, resultLatex=latex(result), steps=steps)
    except Exception as e:
        return SolveResponse(ok=False, error=str(e))
