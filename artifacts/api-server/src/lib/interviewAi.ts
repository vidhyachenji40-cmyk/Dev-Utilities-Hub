import OpenAI from "openai";
import type {
  InterviewFocus,
  InterviewLevel,
  InterviewQuestion,
  InterviewFeedback,
} from "@workspace/db";

const MODEL = "gpt-5.4";

let cachedClient: OpenAI | null = null;

export class InterviewAiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterviewAiUnavailableError";
  }
}

function getOpenAIClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) {
    throw new InterviewAiUnavailableError(
      "OpenAI AI integration is not configured (missing AI_INTEGRATIONS_OPENAI_BASE_URL or AI_INTEGRATIONS_OPENAI_API_KEY).",
    );
  }
  cachedClient = new OpenAI({ apiKey, baseURL });
  return cachedClient;
}

type GenerateQuestionsInput = {
  role: string;
  level: InterviewLevel;
  focus: InterviewFocus;
  company?: string | null;
  notes?: string | null;
  questionCount: number;
};

function clamp(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, 6);
}

export async function generateInterviewQuestions(
  input: GenerateQuestionsInput,
): Promise<InterviewQuestion[]> {
  const { role, level, focus, company, notes, questionCount } = input;

  const focusGuidance =
    focus === "Behavioral"
      ? "All questions must be behavioral (STAR-style situational prompts about past experience)."
      : focus === "Technical"
        ? "All questions must be role-specific technical questions appropriate for the level."
        : "Mix behavioral and technical questions roughly evenly.";

  const systemPrompt = `You are an experienced ${role} interviewer at a strong tech company. You design realistic, fair interview questions that match the candidate's level and the focus area. You return strictly valid JSON.`;

  const userPrompt = `Generate exactly ${questionCount} interview questions for a ${level}-level ${role} candidate${company ? ` interviewing at ${company}` : ""}.

${focusGuidance}

${notes ? `Additional context from the candidate:\n${notes}\n` : ""}
Return JSON of the form:
{
  "questions": [
    { "type": "Behavioral" | "Technical", "text": "...", "starHint": "Short tip on how to structure the answer (use STAR for behavioral)." }
  ]
}

Rules:
- "type" must be exactly "Behavioral" or "Technical".
- Each question text should be one focused question (no compound multi-part questions).
- starHint should be a single helpful sentence about what a strong answer looks like.
- Do not include numbering, prefixes, or markdown.
- Return only the JSON object, no commentary.`;

  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON when generating questions");
  }

  const questionsRaw = (parsed as { questions?: unknown })?.questions;
  if (!Array.isArray(questionsRaw)) {
    throw new Error("AI response is missing a 'questions' array");
  }

  const questions: InterviewQuestion[] = [];
  for (const item of questionsRaw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const text = typeof obj.text === "string" ? obj.text.trim() : "";
    if (!text) continue;
    const rawType = typeof obj.type === "string" ? obj.type : "";
    let type: InterviewQuestion["type"];
    if (rawType === "Behavioral" || rawType === "Technical") {
      type = rawType;
    } else if (focus === "Technical") {
      type = "Technical";
    } else {
      type = "Behavioral";
    }
    const starHint =
      typeof obj.starHint === "string" && obj.starHint.trim().length > 0
        ? obj.starHint.trim()
        : undefined;
    questions.push({
      id: `q_${questions.length + 1}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      text,
      starHint,
    });
    if (questions.length >= questionCount) break;
  }

  if (questions.length === 0) {
    throw new Error("AI returned no usable questions");
  }

  return questions;
}

type FeedbackInput = {
  role: string;
  level: InterviewLevel;
  questionType: InterviewQuestion["type"];
  questionText: string;
  answer: string;
};

export async function generateAnswerFeedback(
  input: FeedbackInput,
): Promise<InterviewFeedback> {
  const { role, level, questionType, questionText, answer } = input;

  const systemPrompt = `You are a tough but supportive interview coach for ${role} candidates. You give specific, actionable feedback. You return strictly valid JSON.`;

  const starGuidance =
    questionType === "Behavioral"
      ? "For behavioral questions, evaluate whether the answer follows the STAR framework (Situation, Task, Action, Result) with concrete details and measurable outcomes."
      : "For technical questions, evaluate correctness, depth, trade-offs, and whether the candidate demonstrated reasoning appropriate for their level.";

  const userPrompt = `Evaluate the following answer from a ${level}-level ${role} candidate.

Question (${questionType}): ${questionText}

Candidate's answer:
"""
${answer}
"""

${starGuidance}

Return JSON of the form:
{
  "clarity": 1-5,
  "structure": 1-5,
  "specificity": 1-5,
  "summary": "1-2 sentence overall assessment.",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}

Rules:
- All three scores must be integers from 1 to 5.
- "strengths" and "improvements" should each have 2-4 short bullet points.
- Be specific to the candidate's actual answer, not generic.
- Return only the JSON object, no commentary or markdown.`;

  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("AI returned invalid JSON when generating feedback");
  }

  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : "No overall assessment was provided.";

  return {
    clarity: clamp(parsed.clarity, 1, 5),
    structure: clamp(parsed.structure, 1, 5),
    specificity: clamp(parsed.specificity, 1, 5),
    summary,
    strengths: asStringArray(parsed.strengths),
    improvements: asStringArray(parsed.improvements),
  };
}
