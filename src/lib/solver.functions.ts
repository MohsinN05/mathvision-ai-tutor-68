export interface SolveResult {
  ok: boolean;
  equationType: string;
  solverUsed: "wolfram" | "fallback" | "sympy";
  resultLatex: string;
  steps: Array<{ stepNumber: number; symbolic: string; explanation: string; why?: string }>;
  error?: string;
}

interface SolveRequest {
  latex: string;
}

export async function solveEquation({ latex }: SolveRequest): Promise<SolveResult> {
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000";
  const url = new URL("/api/solve", backendBaseUrl).toString();

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex }),
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text();
    }
    return {
      ok: false,
      equationType: "unknown",
      solverUsed: "fallback",
      resultLatex: "\\text{Solver request failed}",
      steps: [],
      error: `Solver request failed: ${response.status} ${JSON.stringify(payload)}`,
    };
  }

  return (await response.json()) as SolveResult;
}
