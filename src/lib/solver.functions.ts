import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { latexToQuery, detectEquationType } from "@/lib/math";

export interface SolveResult {
  ok: boolean;
  equationType: string;
  solverUsed: "wolfram" | "fallback" | "sympy";
  resultLatex: string;
  steps: Array<{ stepNumber: number; symbolic: string; explanation: string; why?: string }>;
  error?: string;
}

interface WolframPod {
  title: string;
  subpods?: Array<{ plaintext?: string }>;
}

const Input = z.object({ latex: z.string().min(1).max(500) });

/**
 * Solve equation server-side inside the Lovable Worker.
 * Calls Wolfram Alpha directly with WOLFRAM_APP_ID (loaded from backend/.env
 * by src/server.ts on SSR boot, or set as a Lovable secret in production).
 *
 * This mirrors the REST contract exposed by /backend/src/controllers/solve.controller.ts
 * so a future mobile app can swap base URL without changing UI code.
 */
const solveServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<SolveResult> => {
    const equationType = detectEquationType(data.latex);
    const appId = process.env.WOLFRAM_APP_ID;

    if (!appId) {
      return {
        ok: false,
        equationType,
        solverUsed: "fallback",
        resultLatex: "\\text{Solver unavailable}",
        steps: [],
        error: "WOLFRAM_APP_ID is not configured.",
      };
    }

    const query = latexToQuery(data.latex);
    const url = new URL("https://api.wolframalpha.com/v2/query");
    url.searchParams.set("appid", appId);
    url.searchParams.set("input", query);
    url.searchParams.set("output", "json");
    url.searchParams.set("podstate", "Step-by-step solution");
    url.searchParams.set("format", "plaintext");

    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url.toString());
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
          continue;
        }
        const json = (await res.json()) as {
          queryresult?: { success?: boolean; pods?: WolframPod[] };
        };
        const qr = json.queryresult;
        if (!qr?.success || !qr.pods?.length) {
          lastErr = "no result";
          continue;
        }

        const pods = qr.pods;
        const resultPod =
          pods.find((p) =>
            /result|solution|root|integral|derivative|value/i.test(p.title),
          ) ?? pods[1] ?? pods[0];
        const resultText = resultPod?.subpods?.[0]?.plaintext ?? "";

        const stepsPod = pods.find((p) => /step.?by.?step/i.test(p.title));
        const stepLines =
          stepsPod?.subpods?.flatMap((sp) =>
            (sp.plaintext ?? "")
              .split(/\n+/)
              .map((l) => l.trim())
              .filter(Boolean),
          ) ?? [];

        const escape = (s: string) =>
          s.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");

        const steps = stepLines.length
          ? stepLines.map((line, i) => ({
              stepNumber: i + 1,
              symbolic: `\\text{${escape(line)}}`,
              explanation: line,
            }))
          : pods.slice(0, 4).map((pod, i) => ({
              stepNumber: i + 1,
              symbolic: `\\text{${escape(pod.title)}}`,
              explanation: pod.subpods?.[0]?.plaintext ?? pod.title,
            }));

        return {
          ok: true,
          equationType,
          solverUsed: "wolfram",
          resultLatex: resultText || "\\text{See steps}",
          steps,
        };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "fetch failed";
      }
    }

    return {
      ok: false,
      equationType,
      solverUsed: "fallback",
      resultLatex: "\\text{Solver currently unavailable}",
      steps: [],
      error: lastErr || "Wolfram request failed",
    };
  });

/**
 * Public client-friendly wrapper — keeps the original call signature
 * `solveEquation({ latex })` so existing UI code is untouched.
 */
export async function solveEquation({ latex }: { latex: string }): Promise<SolveResult> {
  try {
    return await solveServerFn({ data: { latex } });
  } catch (err) {
    return {
      ok: false,
      equationType: "unknown",
      solverUsed: "fallback",
      resultLatex: "\\text{Unable to reach solver}",
      steps: [],
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}
