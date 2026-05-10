/**
 * Step-by-Step Explainer Engine.
 * Turns symbolic steps into human-friendly tutor explanations.
 */
const TEMPLATES: Record<string, (line: string) => string> = {
  algebraic: (l) => `We isolate the variable: ${l}.`,
  quadratic: (l) => `Apply the quadratic formula or factor: ${l}.`,
  integral: (l) => `Integrate by applying the power rule: ${l}.`,
  derivative: (l) => `Differentiate term by term: ${l}.`,
  differential: (l) => `Solve the ODE — separate variables or apply integrating factor: ${l}.`,
  trigonometric: (l) => `Apply a trig identity: ${l}.`,
  default: (l) => l,
};

export const explanationEngine = {
  build(symbolicSteps: string[], equationType: string) {
    const tpl = TEMPLATES[equationType] ?? TEMPLATES.default;
    return symbolicSteps.map((line, i) => ({
      stepNumber: i + 1,
      symbolic: line,
      explanation: tpl(line),
    }));
  },
};
