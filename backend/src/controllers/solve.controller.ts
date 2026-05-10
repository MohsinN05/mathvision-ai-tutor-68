import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { wolframSolver } from "../services/wolfram.service";
import { pythonSolver } from "../services/python.service";
import { explanationEngine } from "../services/explanation.service";
import { detectEquationType } from "../utils/equation";

const Body = z.object({ latex: z.string().min(1).max(500) });

export const solveController = {
  /**
   * POST /api/solve
   * Pipeline: validate -> detect -> SymPy (Python) -> Wolfram fallback -> explain.
   */
  async solve(req: Request, res: Response, next: NextFunction) {
    try {
      const { latex } = Body.parse(req.body);
      const equationType = detectEquationType(latex);

      let solverUsed: "sympy" | "wolfram" | "fallback" = "fallback";
      let resultLatex = "";
      let symbolicSteps: string[] = [];

      try {
        const py = await pythonSolver.solve({ latex, equationType });
        if (py.ok) {
          solverUsed = "sympy";
          resultLatex = py.resultLatex;
          symbolicSteps = py.steps;
        }
      } catch {
        /* fall through */
      }

      if (!resultLatex) {
        const wf = await wolframSolver.solve({ latex });
        if (wf.ok) {
          solverUsed = "wolfram";
          resultLatex = wf.resultLatex;
          symbolicSteps = wf.steps;
        }
      }

      if (!resultLatex) {
        return res.status(503).json({
          ok: false,
          equationType,
          solverUsed: "fallback",
          error: "Solver currently unavailable",
        });
      }

      const steps = explanationEngine.build(symbolicSteps, equationType);

      return res.json({
        ok: true,
        equationType,
        solverUsed,
        resultLatex,
        steps,
      });
    } catch (err) {
      next(err);
    }
  },
};
