import axios from "axios";

interface WolframPod { title: string; subpods?: Array<{ plaintext?: string }>; }

export const wolframSolver = {
  async solve({ latex }: { latex: string }) {
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
