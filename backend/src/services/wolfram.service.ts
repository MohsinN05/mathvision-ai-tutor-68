import axios from "axios";

interface WolframPod { title: string; subpods?: Array<{ plaintext?: string }>; }

export const wolframSolver = {
  async solve({ latex }: { latex: string }) {
    const appId = process.env.K2X7RW7V86;
    if (!appId) return { ok: false as const };

    const query = latexToQuery(latex);
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data } = await axios.get("https://api.wolframalpha.com/v2/query", {
          params: { appid: appId, input: query, output: "json", format: "plaintext", podstate: "Step-by-step solution" },
          timeout: 12_000,
        });
        const qr = data?.queryresult;
        if (!qr?.success || !qr.pods?.length) { lastErr = "no result"; continue; }
        const pods: WolframPod[] = qr.pods;
        const resultPod = pods.find((p) => /result|solution|root|integral|derivative|value/i.test(p.title)) ?? pods[1] ?? pods[0];
        const resultLatex = resultPod?.subpods?.[0]?.plaintext ?? "";
        const stepsPod = pods.find((p) => /step.?by.?step/i.test(p.title));
        const steps = stepsPod?.subpods?.flatMap((sp) => (sp.plaintext ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean)) ?? [];
        return { ok: true as const, resultLatex, steps };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "fetch failed";
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
