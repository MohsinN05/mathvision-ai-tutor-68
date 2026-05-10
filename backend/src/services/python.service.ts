import axios from "axios";

/**
 * Talks to the Python FastAPI microservice (python-service/) which performs
 * SymPy-based symbolic computation. If unreachable, returns ok:false so the
 * controller falls back to Wolfram Alpha.
 */
export const pythonSolver = {
  async solve({ latex, equationType }: { latex: string; equationType: string }) {
    const baseUrl = process.env.PYTHON_SOLVER_URL;
    if (!baseUrl) return { ok: false as const };
    try {
      const { data } = await axios.post(
        `${baseUrl}/solve`,
        { latex, equationType },
        { timeout: 10_000 },
      );
      return {
        ok: Boolean(data?.ok),
        resultLatex: data?.resultLatex ?? "",
        steps: (data?.steps ?? []) as string[],
      };
    } catch {
      return { ok: false as const };
    }
  },
};
