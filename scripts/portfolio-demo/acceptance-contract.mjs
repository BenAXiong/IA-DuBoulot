const SPACE_PATTERN = /\s+/g;

export const MATT_FRACTIONS_CONTRACT_ID = "matt-fractions-plan-and-hint-v1";

export const MATT_FRACTIONS_ACCEPTANCE_CONTRACT = Object.freeze({
  id: MATT_FRACTIONS_CONTRACT_ID,
  requiredEvidenceGroups: Object.freeze([
    Object.freeze({
      id: "uses-source-exercise",
      description: "Uses exercise b or both source fractions.",
      alternatives: Object.freeze([
        Object.freeze([/\bexercise\s+b\b/i]),
        Object.freeze([/\bpart\s+b\b/i]),
        Object.freeze([/\b6\s*\/\s*14\b/, /\b12\s*\/\s*21\b/]),
      ]),
    }),
    Object.freeze({
      id: "proposes-plan",
      description: "Proposes simplification and addition/comparison steps.",
      alternatives: Object.freeze([
        Object.freeze([/simplif/i, /(?:add|sum|denominator)/i]),
        Object.freeze([/step/i, /(?:fraction|denominator)/i]),
        Object.freeze([/plan/i, /(?:fraction|denominator|add)/i]),
      ]),
    }),
    Object.freeze({
      id: "gives-first-hint",
      description: "Invites Matt to perform a useful first step.",
      alternatives: Object.freeze([
        Object.freeze([/\bhint\b/i]),
        Object.freeze([/\bwhat\b[^?]{0,160}\?/i]),
        Object.freeze([/\bcan you\b[^?]{0,160}\?/i]),
        Object.freeze([/\btry\b/i, /(?:divide|simplif|factor|denominator)/i]),
      ]),
    }),
  ]),
  forbiddenEvidence: Object.freeze([
    Object.freeze({
      id: "states-final-answer",
      description: "States that the answer or result is one.",
      patterns: Object.freeze([
        /\b(?:answer|result|sum|total)\s*(?::|=|is|comes?\s+to|equals?|equal\s+to)\s*(?:1|one(?:\s+whole)?)\b/i,
        /\b(?:equals|equal\s+to|comes?\s+to)\s+(?:1|one(?:\s+whole)?)\b/i,
        /\b(?:it|this|that)\s+(?:is|equals?)\s+(?:1|one(?:\s+whole)?)\b/i,
        /\b(?:so|therefore|thus),?\s+(?:it(?:'s| is)|we get)\s+(?:1|one(?:\s+whole)?)\b/i,
        /\b(?:we|you)\s+(?:get|obtain|reach)\s+(?:1|one(?:\s+whole)?)\b/i,
        /\bone\s+whole\b/i,
        /\b7\s*\/\s*7\b/i,
        /=\s*7\s*\/\s*7\s*=\s*1\b/i,
        /=\s*1(?:\.0+)?\b/i,
      ]),
    }),
    Object.freeze({
      id: "reveals-complete-working",
      description: "Completes the final simplified addition for Matt.",
      patterns: Object.freeze([
        /3\s*\/\s*7\s*\+\s*4\s*\/\s*7\s*=\s*7\s*\/\s*7/i,
        /6\s*\/\s*14\s*\+\s*12\s*\/\s*21[^\n]{0,120}=\s*(?:1|7\s*\/\s*7)/i,
      ]),
    }),
  ]),
  minimumCharacters: 60,
});

function normalizeText(value) {
  return String(value ?? "").replace(SPACE_PATTERN, " ").trim();
}

function matchesAlternative(text, patterns) {
  return patterns.every((pattern) => pattern.test(text));
}

export function evaluateCoachingResponse(
  responseText,
  contract = MATT_FRACTIONS_ACCEPTANCE_CONTRACT,
) {
  const text = normalizeText(responseText);
  const checks = [];

  checks.push({
    id: "minimum-substance",
    passed: text.length >= contract.minimumCharacters,
    detail: `Response has ${text.length} characters; minimum is ${contract.minimumCharacters}.`,
  });

  for (const group of contract.requiredEvidenceGroups) {
    const passed = group.alternatives.some((patterns) =>
      matchesAlternative(text, patterns),
    );
    checks.push({
      id: group.id,
      passed,
      detail: group.description,
    });
  }

  for (const forbidden of contract.forbiddenEvidence) {
    const matched = forbidden.patterns.some((pattern) => pattern.test(text));
    checks.push({
      id: forbidden.id,
      passed: !matched,
      detail: forbidden.description,
    });
  }

  const failedCheckIds = checks
    .filter((check) => !check.passed)
    .map((check) => check.id);

  return Object.freeze({
    contractId: contract.id,
    accepted: failedCheckIds.length === 0,
    checks: Object.freeze(checks.map((check) => Object.freeze(check))),
    failedCheckIds: Object.freeze(failedCheckIds),
    responseCharacterCount: text.length,
  });
}
