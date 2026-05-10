/**
 * Step-by-Step Explainer Engine.
 * Turns symbolic steps into human-friendly tutor explanations.
 */
function cleanStep(line: string) {
  return line.trim().replace(/\s+/g, " ").replace(/^•\s*/g, "");
}

function defaultExplanation(line: string) {
  if (!line) return "Continue with the next algebraic transformation.";
  if (/solve|finding|find|isolat/i.test(line)) return `Solve the expression: ${line}.`;
  if (/simplif/i.test(line)) return `Simplify the expression: ${line}.`;
  if (/factor/i.test(line)) return `Factor the expression: ${line}.`;
  if (/expand/i.test(line)) return `Expand the expression: ${line}.`;
  if (/divide/i.test(line)) return `Divide both sides or simplify by division: ${line}.`;
  if (/multiply/i.test(line)) return `Multiply both sides or simplify by multiplication: ${line}.`;
  if (/add/i.test(line)) return `Add terms or move them to the other side: ${line}.`;
  if (/subtract/i.test(line)) return `Subtract terms or isolate the variable: ${line}.`;
  if (/integrat/i.test(line)) return `Integrate the expression: ${line}.`;
  if (/derivat/i.test(line)) return `Differentiate step-by-step: ${line}.`;
  if (/substitut/i.test(line)) return `Substitute the known value or expression: ${line}.`;
  if (/simplify/i.test(line)) return `Simplify the expression: ${line}.`;
  if (/=/.test(line)) return `Rewrite the equation as: ${line}.`;
  return `Perform the next step: ${line}.`;
}

const TEMPLATES: Record<string, (line: string) => string> = {
  algebraic: (line) => defaultExplanation(line),
  quadratic: (line) => {
    if (/quadratic formula/i.test(line)) return `Apply the quadratic formula: ${line}.`;
    if (/\(x[^)]+\)\s*\(x[^)]+\)\s*=\s*0/.test(line)) return `Factor the quadratic equation into: ${line}.`;
    if (/^x\s*=\s*[-]?\d*\.?\d+$/.test(line)) return `Solve for x: ${line}.`;
    if (/completing the square|complete.*square/i.test(line)) return `Complete the square to solve: ${line}.`;
    if (/factor/i.test(line)) return `Factor the quadratic expression: ${line}.`;
    if (/=\s*0/.test(line) && /\^2/.test(line)) return `Set the equation equal to zero and solve: ${line}.`;
    if (/=\s*0/.test(line)) return `Set each factor equal to zero: ${line}.`;
    if (/^x\^2.*=.*x/.test(line)) return `Rearrange the equation: ${line}.`;
    if (/\^2.*-.*1\/4.*=\s*0/.test(line)) return `Complete the square: ${line}.`;
    return defaultExplanation(line);
  },
  integral: (line) => {
    if (/substitut/i.test(line)) return `Use substitution to integrate: ${line}.`;
    return `Integrate the expression using the proper rule: ${line}.`;
  },
  derivative: (line) => {
    if (/power rule/i.test(line)) return `Differentiate using the power rule: ${line}.`;
    return `Differentiate the expression step-by-step: ${line}.`;
  },
  differential: (line) => {
    if (/separat/i.test(line)) return `Separate variables and integrate: ${line}.`;
    return `Solve the differential equation using the appropriate method: ${line}.`;
  },
  trigonometric: (line) => {
    if (/identity/i.test(line)) return `Apply a trigonometric identity: ${line}.`;
    return `Use trig simplification or substitution: ${line}.`;
  },
  default: (line) => defaultExplanation(line),
};

export const explanationEngine = {
  build(symbolicSteps: string[], equationType: string) {
    return symbolicSteps.map((step, i) => {
      const line = cleanStep(step);
      const tpl = TEMPLATES[equationType] ?? TEMPLATES.default;
      return {
        stepNumber: i + 1,
        symbolic: line,
        explanation: tpl(line),
        why: getWhyExplanation(line, equationType, i, symbolicSteps.length),
      };
    });
  },
};

function getWhyExplanation(line: string, equationType: string, stepIndex: number, totalSteps: number): string {
  if (equationType === "quadratic") {
    if (stepIndex === 0) {
      return "We start with the original quadratic equation that we need to solve.";
    }
    if (/\(x[^)]+\)\s*\(x[^)]+\)\s*=\s*0/.test(line)) {
      return "Factoring helps us break down the quadratic into simpler linear factors.";
    }
    if (/^x\s*=\s*[-]?\d*\.?\d+$/.test(line)) {
      return "Each factor being zero gives us a solution to the original equation.";
    }
    if (/^x\^2.*=.*x/.test(line)) {
      return "Rearranging helps us prepare for factoring or other solving methods.";
    }
    if (/\^2.*-.*1\/4.*=\s*0/.test(line)) {
      return "Completing the square transforms the equation into a perfect square trinomial.";
    }
    if (stepIndex === totalSteps - 1 && /=.*\d+/.test(line)) {
      return "These are the final solutions that satisfy the original quadratic equation.";
    }
  }

  // Default explanation
  return `This step helps move closer to the final answer by focusing on the core operation: ${line}.`;
}
