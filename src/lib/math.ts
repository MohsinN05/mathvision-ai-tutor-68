/**
 * Lightweight LaTeX → Wolfram-friendly query string converter.
 * Strips common LaTeX wrappers so Wolfram Alpha can parse it.
 */
export function latexToQuery(latex: string): string {
  let s = latex.trim();
  s = s.replace(/\\\\/g, " ");
  s = s.replace(/\\left|\\right/g, "");
  s = s.replace(/\\,|\\;|\\!|\\:/g, "");
  s = s.replace(/\\cdot/g, "*");
  s = s.replace(/\\times/g, "*");
  s = s.replace(/\\div/g, "/");
  s = s.replace(/\\pi/g, "pi");
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  s = s.replace(/\\(sin|cos|tan|sec|csc|cot|log|ln|exp)/g, "$1");
  s = s.replace(/\\int/g, "integrate");
  s = s.replace(/\\sum/g, "sum");
  s = s.replace(/\^\{([^{}]+)\}/g, "^($1)");
  s = s.replace(/[{}]/g, "");
  return s.trim();
}

export type EquationType =
  | "algebraic"
  | "quadratic"
  | "differential"
  | "integral"
  | "derivative"
  | "trigonometric"
  | "system"
  | "unknown";

export function detectEquationType(latex: string): EquationType {
  const s = latex.toLowerCase();
  if (/\\int|\bintegrate\b/.test(s)) return "integral";
  if (/\\frac\{d\}\{d[a-z]\}|\bdy\/dx|d\/dx/.test(s)) return "derivative";
  if (/y'|y''|dy\/dx|\bdsolve\b/.test(s)) return "differential";
  if (/\\sin|\\cos|\\tan|\\sec|\\csc|\\cot/.test(s)) return "trigonometric";
  if (/x\^2|x\^\{2\}/.test(s) && /=/.test(s)) return "quadratic";
  if (/=/.test(s)) return "algebraic";
  return "unknown";
}
