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
    const requestBody = { latex, equationType };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ event: "python-solver-request", url: `${baseUrl}/solve`, request: requestBody }));
    try {
      const { data } = await axios.post(
        `${baseUrl}/solve`,
        requestBody,
        { timeout: 10_000 },
      );
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ event: "python-solver-response", response: data }));
      return {
        ok: Boolean(data?.ok),
        resultLatex: data?.resultLatex ?? "",
        steps: (data?.steps ?? []) as string[],
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ event: "python-solver-error", error: error?.toString?.() ?? String(error) }));
      return { ok: false as const };
    }
  },
};
