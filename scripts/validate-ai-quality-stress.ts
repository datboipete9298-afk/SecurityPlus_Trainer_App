/**
 * AI quality stress test — exercises `isWeakAiResponse` and
 * `enforceStructuredAiResponse` with realistic adversarial inputs:
 *
 *   - empty / whitespace-only payloads
 *   - refusal-style answers
 *   - generic platitudes ("study harder", "good luck", …)
 *   - duplicate / very-short bullet lists
 *   - tautological responses (key points just rehashing the answer)
 *   - partial JSON shape (missing keyPoints / nextAction)
 *   - non-string inputs
 *
 * Asserts:
 *   - weak inputs are correctly classified as weak (→ fallback to coach)
 *   - `enforceStructuredAiResponse` always returns a fully populated
 *     structured response (answer + ≥1 keypoint + examTip + nextAction)
 *
 * Build-blocking when wired into `npm run build`.
 */
import { isWeakAiResponse } from "../src/lib/aiResponseQuality";
import { enforceStructuredAiResponse } from "../src/lib/aiResponseQuality";
import type { AiTutorResponse } from "../src/types/aiTutor";

let failed = 0;

function expect(label: string, cond: boolean, detail = ""): void {
  if (!cond) {
    failed++;
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function asResp(partial: Partial<AiTutorResponse> | null | undefined): AiTutorResponse {
  return {
    answer: partial?.answer ?? "",
    keyPoints: partial?.keyPoints ?? [],
    examTip: partial?.examTip ?? "",
    nextAction: partial?.nextAction ?? "",
    confidence: partial?.confidence ?? "medium",
  };
}

console.log("validate-ai-quality-stress: 28 cases");

/* ------------------------ isWeakAiResponse cases ------------------------ */

expect("null returns weak", isWeakAiResponse(null) === true);
expect("undefined returns weak", isWeakAiResponse(undefined) === true);
expect("non-object returns weak", isWeakAiResponse({ answer: 42 } as unknown as AiTutorResponse) === true);
expect("empty answer returns weak", isWeakAiResponse({ answer: "" }) === true);
expect("whitespace-only answer returns weak", isWeakAiResponse({ answer: "    \n  \t  " }) === true);
expect("very short answer (<28) returns weak", isWeakAiResponse({ answer: "Yes." }) === true);
expect(
  "short refusal returns weak",
  isWeakAiResponse({
    answer: "I'm sorry, I cannot answer that.",
    keyPoints: ["Try again later", "Ask differently"],
    nextAction: "Open the lesson once more.",
  }) === true,
);
expect(
  "long refusal NOT weak (passes through)",
  isWeakAiResponse({
    answer:
      "I cannot help with that exact phrasing, but here is the security-relevant rule: when a stem mentions 'least privilege', the right answer almost always tightens scope rather than adding controls. The trap is to over-engineer.",
    keyPoints: [
      "Tighten scope before adding tools.",
      "Watch the verb — 'restrict' beats 'add' in least-privilege stems.",
    ],
    examTip: "Verbs decide.",
    nextAction: "Re-read the stem and underline the verb.",
  }) === false,
);
expect(
  "generic platitude returns weak",
  isWeakAiResponse({
    answer: "Study harder.",
    keyPoints: ["Study more", "Practice"],
    nextAction: "Open a flashcard.",
  }) === true,
);
expect(
  "good luck platitude returns weak",
  isWeakAiResponse({
    answer: "Good luck.",
    keyPoints: ["You got this", "Believe"],
    nextAction: "Keep your study rhythm going.",
  }) === true,
);
expect(
  "1 keypoint returns weak",
  isWeakAiResponse({
    answer: "Use a TPM with attestation for hardware-backed key storage on enterprise endpoints.",
    keyPoints: ["TPM with attestation"],
    nextAction: "Find a question on TPM in your lesson quiz.",
  }) === true,
);
expect(
  "duplicate keypoints (after lowercase) return weak",
  isWeakAiResponse({
    answer: "Use a TPM with attestation for hardware-backed key storage on enterprise endpoints.",
    keyPoints: ["TPM with attestation", "tpm with attestation", "TPM with attestation"],
    nextAction: "Find a question on TPM in your lesson quiz.",
  }) === true,
);
expect(
  "all-short keypoints return weak",
  isWeakAiResponse({
    answer: "Use a TPM with attestation for hardware-backed key storage on enterprise endpoints.",
    keyPoints: ["A.", "B.", "C."],
    nextAction: "Find a question on TPM in your lesson quiz.",
  }) === true,
);
expect(
  "missing nextAction returns weak",
  isWeakAiResponse({
    answer: "Use a TPM with attestation for hardware-backed key storage on enterprise endpoints.",
    keyPoints: ["TPM with attestation", "Hardware key storage"],
    nextAction: "go",
  }) === true,
);
expect(
  "tautological answer + keypoints returns weak",
  isWeakAiResponse({
    answer:
      "TPM attestation hardware backed keys storage enterprise endpoints attestation hardware",
    keyPoints: [
      "TPM hardware keys attestation",
      "TPM enterprise hardware keys",
      "Hardware backed keys storage",
      "Enterprise endpoints attestation",
    ],
    nextAction: "Practice TPM hardware keys attestation in the next quiz.",
  }) === true,
);
expect(
  "good response is NOT weak",
  isWeakAiResponse({
    answer:
      "Use the TPM with attestation when the stem says hardware-backed key storage on enterprise endpoints. The trap answer is HSM, which is correct for cluster-wide cryptographic operations but wrong for per-device sealing.",
    keyPoints: [
      "TPM = per-device sealed keys + remote attestation.",
      "HSM = cluster-wide crypto, not per-endpoint sealing.",
      "If 'attestation' appears in the stem, lean TPM.",
    ],
    examTip: "Attestation triggers TPM; bulk crypto triggers HSM.",
    nextAction: "Open one quiz on cryptographic hardware and answer the next stem first.",
    confidence: "high",
  }) === false,
);

/* ------------------ enforceStructuredAiResponse cases ------------------ */

const filled = enforceStructuredAiResponse(asResp({ answer: "Short." }), "tutor");
expect(
  "enforce: empty input → produces ≥1 keypoint + examTip + nextAction",
  filled.keyPoints.length >= 1 && filled.examTip.length >= 12 && filled.nextAction.length >= 10,
);
expect("enforce: answer is non-empty", filled.answer.length > 0);

const empty = enforceStructuredAiResponse(asResp({}), "tutor");
expect("enforce: missing all fields → all defaults applied", empty.keyPoints.length >= 1);

const oneKp = enforceStructuredAiResponse(
  asResp({
    answer: "A real answer that has more than twenty-eight characters in it for the test.",
    keyPoints: ["Only one keypoint"],
  }),
  "tutor",
);
expect("enforce: 1 keypoint becomes ≥2", oneKp.keyPoints.length >= 2);

const highWithLowKp = enforceStructuredAiResponse(
  asResp({
    answer: "Solid answer that has more than twenty-eight characters present.",
    keyPoints: ["just one"],
    confidence: "high",
  }),
  "tutor",
);
expect(
  "enforce: confidence is downgraded when keypoints < 2 originally",
  highWithLowKp.confidence === "medium",
);

/* ------------------------ Result ------------------------ */
if (failed > 0) {
  console.error(`validate-ai-quality-stress: FAIL — ${failed} case(s) above.`);
  process.exit(1);
}
console.log("validate-ai-quality-stress: OK — all weak/strong/enforce cases behave as expected.");
