export type EquationType =
  | "algebraic" | "quadratic" | "differential" | "integral"
  | "derivative" | "trigonometric" | "system" | "unknown";

export function detectEquationType(latex: string): EquationType {
  const s = latex.toLowerCase();
  if (/\\int|\bintegrate\b/.test(s)) return "integral";
  if (/\\frac\{d\}\{d[a-z]\}|d\/dx/.test(s)) return "derivative";
  if (/y'|y''|dy\/dx/.test(s)) return "differential";
  if (/\\sin|\\cos|\\tan|\\sec|\\csc|\\cot/.test(s)) return "trigonometric";
  if (/x\^2|x\^\{2\}/.test(s) && /=/.test(s)) return "quadratic";
  if (/=/.test(s)) return "algebraic";
  return "unknown";
}
