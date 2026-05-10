import axios from "axios";

interface WolframPod { title: string; subpods?: Array<{ plaintext?: string }>; }

export const wolframSolver = {
  async solve({ latex, equationType }: { latex: string; equationType?: string }) {
    const appId = process.env.WOLFRAM_APP_ID;
    if (!appId) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ event: "wolfram-missing-appid", latex }));
      return { ok: false as const, error: "WOLFRAM_APP_ID is missing" };
    }

    const query = latexToQuery(latex);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ event: "wolfram-query", query, latex }));
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data } = await axios.get("https://api.wolframalpha.com/v2/query", {
          params: { appid: appId, input: query, output: "json", format: "plaintext", podstate: "Step-by-step solution" },
          timeout: 12_000,
        });
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ event: "wolfram-response", attempt, data: { queryresult: { success: data?.queryresult?.success, podCount: data?.queryresult?.pods?.length } } }));
        const qr = data?.queryresult;
        if (!qr?.success || !qr.pods?.length) {
          lastErr = "no result";
          continue;
        }
        const pods: WolframPod[] = qr.pods;
        const resultPod =
          pods.find((p) => /solutions?/i.test(p.title)) ??
          pods.find((p) => /result|solution|root|roots|integral|derivative|value|output|simplified/i.test(p.title)) ??
          pods[1] ??
          pods[0];

        let resultLatex =
          resultPod?.subpods
            ?.map((sp) => sp.plaintext?.trim() ?? "")
            .filter(Boolean)
            .join(", ") ?? "";
        const stepsPod = pods.find((p) => /step.?by.?step/i.test(p.title));
        let steps =
          stepsPod?.subpods?.flatMap((sp) =>
            (sp.plaintext ?? "")
              .split(/\n+/)
              .map((l) => l.trim())
              .filter(Boolean),
          ) ?? [];

        if (steps.length === 0) {
          const alternateForms = pods.find((p) => /alternate forms?/i.test(p.title));
          const alternateLines =
            alternateForms?.subpods
              ?.map((sp) => sp.plaintext?.trim() ?? "")
              .filter(Boolean) ?? [];
          const resultLines =
            resultPod?.subpods
              ?.map((sp) => sp.plaintext?.trim() ?? "")
              .filter(Boolean) ?? [];
          steps = [...alternateLines, ...resultLines];
        }

        if (!resultLatex) {
          const answerLine = steps.find((line) => /\b[xX]\s*=\s*[^,;]+/.test(line));
          if (answerLine) {
            resultLatex = answerLine;
          }
        }

        if (!resultLatex) {
          const fallbackPod = pods.find((p) => p.subpods?.[0]?.plaintext?.trim());
          resultLatex = fallbackPod?.subpods?.[0]?.plaintext?.trim() ?? "";
        }

        // Reorder steps for better pedagogical flow
        const originalSteps = [...steps];
        steps = reorderStepsForEquationType(steps, equationType, latex);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
          event: "wolfram-steps-reordered",
          equationType,
          originalSteps,
          reorderedSteps: steps
        }));

        return { ok: true as const, resultLatex, steps };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "fetch failed";
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ event: "wolfram-error", attempt, error: lastErr }));
      }
    }
    return { ok: false as const, error: lastErr };
  },
};

function reorderStepsForEquationType(steps: string[], equationType: string = "unknown", originalLatex?: string): string[] {
  if (equationType === "quadratic") {
    return reorderQuadraticSteps(steps, originalLatex);
  }
  // For other equation types, return as-is for now
  return steps;
}

function reorderQuadraticSteps(steps: string[], originalLatex?: string): string[] {
  const reordered: string[] = [];
  const solutions: string[] = [];
  let factoredForm = "";
  const intermediateSteps: string[] = [];

  // First pass: categorize steps
  for (const step of steps) {
    const cleanStep = step.trim();
    if (/\(x[^)]+\)\s*\(x[^)]+\)\s*=\s*0/.test(cleanStep)) {
      // Factored form like (x-3)(x-2) = 0
      factoredForm = cleanStep;
    } else if (/^x\s*=\s*[-]?\d*\.?\d+$/.test(cleanStep)) {
      // Solutions like x = 2, x = 3, x = -1, x = 1.5
      solutions.push(cleanStep);
    } else if (cleanStep.includes('=') && !cleanStep.includes('^2 - 1/4')) {
      // Other equations that aren't the completing the square step
      intermediateSteps.push(cleanStep);
    } else {
      // Everything else (including completing the square)
      intermediateSteps.push(cleanStep);
    }
  }

  // Add original equation first if we have it
  if (originalLatex) {
    // Convert LaTeX to plain text format for consistency
    const plainOriginal = latexToPlainEquation(originalLatex);
    if (!steps.some(s => s.includes(plainOriginal) || plainOriginal.includes(s))) {
      reordered.push(plainOriginal);
    }
  }

  // Add factored form if we have it
  if (factoredForm) {
    reordered.push(factoredForm);
  }

  // Add intermediate steps
  reordered.push(...intermediateSteps.filter(s => s !== factoredForm));

  // Add solutions at the end
  if (solutions.length > 0) {
    reordered.push(...solutions);
  }

  // If we don't have a good reordering, return original
  return reordered.length > 0 ? reordered : steps;
}

function latexToPlainEquation(latex: string): string {
  return latex
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\cdot/g, "*")
    .replace(/[{}]/g, "")
    .trim();
}

function latexToQuery(s: string) {
  return s
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\int/g, "integrate")
    .replace(/\\(sin|cos|tan|log|ln|exp|pi)/g, "$1")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/[{}]/g, "")
    .trim();
}
