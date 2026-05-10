import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { latexToQuery, detectEquationType } from "@/lib/math";

const Input = z.object({ latex: z.string().min(1).max(500) });

interface WolframPod {
  title: string;
  subpods?: Array<{ plaintext?: string }>;
}

interface SolveResult {
  ok: boolean;
  equationType: string;
  solverUsed: "wolfram" | "fallback";
  resultLatex: string;
  steps: Array<{ stepNumber: number; symbolic: string; explanation: string }>;
  error?: string;
}

/**
 * Solve an equation using the Wolfram Alpha API.
 * Requires WOLFRAM_APP_ID secret. Returns a graceful fallback if missing/failing.
 *
 * REST contract (mirrored by the standalone /backend Express service):
 *   POST /api/solve  body: { latex: string }  ->  SolveResult
 */
export const solveEquation = createServerFn({ method: "POST" })
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
        error: "WOLFRAM_APP_ID is not configured. Add it in project secrets.",
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
        if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
        const json = (await res.json()) as { queryresult?: { success?: boolean; pods?: WolframPod[] } };
        const qr = json.queryresult;
        if (!qr?.success || !qr.pods?.length) { lastErr = "no result"; continue; }

        const pods = qr.pods;
        const resultPod =
          pods.find((p) => /result|solution|root|integral|derivative|value/i.test(p.title)) ?? pods[1] ?? pods[0];
        const resultText = resultPod?.subpods?.[0]?.plaintext ?? "";

        const stepsPod = pods.find((p) => /step.?by.?step/i.test(p.title));
        const stepLines = stepsPod?.subpods?.flatMap((sp) =>
          (sp.plaintext ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean),
        ) ?? [];

        const steps = stepLines.length
          ? stepLines.map((line, i) => ({
              stepNumber: i + 1,
              symbolic: `\\text{${line.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}")}}`,
              explanation: line,
            }))
          : pods.slice(0, 4).map((pod, i) => ({
              stepNumber: i + 1,
              symbolic: `\\text{${pod.title}}`,
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
      error: lastErr || "Wolfram request failed after 3 retries",
    };
  });
