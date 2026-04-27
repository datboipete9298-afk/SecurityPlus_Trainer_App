export type AiTutorConfidence = "low" | "medium" | "high";

export type AiTutorResponse = {
  answer: string;
  keyPoints: string[];
  examTip: string;
  nextAction: string;
  confidence: AiTutorConfidence;
};

export type AiRequestMode = "tutor" | "explain" | "note-feedback" | "quiz-help" | "lab-coach";

export type AiTutorRequestBody = {
  mode: AiRequestMode;
  userQuestion?: string;
  lesson?: Record<string, unknown> | null;
  userProgress?: Record<string, unknown> | null;
  weakAreas?: string[];
  quizContext?: Record<string, unknown> | null;
  noteContext?: Record<string, unknown> | null;
  labContext?: Record<string, unknown> | null;
  /** PDF guided study — section summary, must highlights, user-captured hooks */
  pdfGuideContext?: Record<string, unknown> | null;
  /** When true (Beginner mode): shorter, plainer answers on the server */
  simpleMode?: boolean;
};
