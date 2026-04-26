import { genericOutlineLesson } from "./lessonFactory";

/** Domains 3–5 outline slots (full course path; expand later with more detail). */
export const outlineLessons = {
  "3-0": genericOutlineLesson("3-0", "3.0 Security Architecture (full outline in your notes)", "3"),
  "3-models": genericOutlineLesson("3-models", "3.x Models, frameworks, secure design", "3"),
  "3-cloud": genericOutlineLesson("3-cloud", "3.x Cloud & virtualization", "3"),
  "3-iot": genericOutlineLesson("3-iot", "3.x IoT & embedded", "3"),
  "4-0": genericOutlineLesson("4-0", "4.0 Security Operations (full outline in your notes)", "4"),
  "4-ops": genericOutlineLesson("4-ops", "4.x Monitoring, hardening, IR, logging (align to Messer 4.x)", "4"),
  "5-0": genericOutlineLesson("5-0", "5.0 GRC, policies, risk, compliance", "5"),
  "5-grc": genericOutlineLesson("5-grc", "5.x Governance, risk, compliance, privacy", "5"),
};
