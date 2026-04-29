import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  interviewAnswersTable,
  interviewSessionsTable,
  jobApplicationsTable,
  usersTable,
  type InterviewAnswer,
  type InterviewSession,
  type InterviewQuestion,
} from "@workspace/db";
import {
  CreateInterviewSessionBody,
  DeleteInterviewSessionParams,
  GetInterviewSessionParams,
  GetInterviewSessionResponse,
  ListInterviewSessionsResponse,
  SubmitInterviewAnswerBody,
  SubmitInterviewAnswerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import {
  generateAnswerFeedback,
  generateInterviewQuestions,
  InterviewAiUnavailableError,
} from "../lib/interviewAi";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function ensureUserRecord(userId: string): Promise<void> {
  await db
    .insert(usersTable)
    .values({ id: userId })
    .onConflictDoNothing({ target: usersTable.id });
}

function serializeSession(
  session: InterviewSession,
  questionCount: number,
  answeredCount: number,
) {
  return {
    id: session.id,
    role: session.role,
    level: session.level,
    focus: session.focus,
    company: session.company,
    notes: session.notes,
    applicationId: session.applicationId,
    questionCount,
    answeredCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeAnswer(answer: InterviewAnswer) {
  return {
    id: answer.id,
    sessionId: answer.sessionId,
    questionId: answer.questionId,
    questionText: answer.questionText,
    body: answer.body,
    feedback: answer.feedback ?? null,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
  };
}

router.get(
  "/interview/sessions",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;

    const sessions = await db
      .select()
      .from(interviewSessionsTable)
      .where(eq(interviewSessionsTable.userId, userId))
      .orderBy(desc(interviewSessionsTable.createdAt));

    const answerCounts = await db
      .select({
        sessionId: interviewAnswersTable.sessionId,
        count: sql<number>`count(*)::int`,
      })
      .from(interviewAnswersTable)
      .where(eq(interviewAnswersTable.userId, userId))
      .groupBy(interviewAnswersTable.sessionId);

    const countBySession = new Map<string, number>();
    for (const row of answerCounts) {
      countBySession.set(row.sessionId, Number(row.count));
    }

    res.json(
      ListInterviewSessionsResponse.parse({
        sessions: sessions.map((s) =>
          serializeSession(
            s,
            Array.isArray(s.questions) ? s.questions.length : 0,
            countBySession.get(s.id) ?? 0,
          ),
        ),
      }),
    );
  },
);

router.post(
  "/interview/sessions",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;

    const parsed = CreateInterviewSessionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data = parsed.data;
    const questionCount = data.questionCount ?? 5;

    await ensureUserRecord(userId);

    let applicationId: string | null = null;
    let companyFromApp: string | null = null;
    let roleFromApp: string | null = null;
    if (data.applicationId) {
      const [app] = await db
        .select({
          id: jobApplicationsTable.id,
          company: jobApplicationsTable.company,
          role: jobApplicationsTable.role,
        })
        .from(jobApplicationsTable)
        .where(
          and(
            eq(jobApplicationsTable.id, data.applicationId),
            eq(jobApplicationsTable.userId, userId),
          ),
        );
      if (!app) {
        res.status(400).json({ error: "Linked application not found" });
        return;
      }
      applicationId = app.id;
      companyFromApp = app.company;
      roleFromApp = app.role;
    }

    const role = data.role.trim() || roleFromApp || "Software Engineer";
    const company = data.company ?? companyFromApp ?? null;

    let questions: InterviewQuestion[];
    try {
      questions = await generateInterviewQuestions({
        role,
        level: data.level,
        focus: data.focus,
        company,
        notes: data.notes ?? null,
        questionCount,
      });
    } catch (err) {
      if (err instanceof InterviewAiUnavailableError) {
        logger.warn({ err: err.message }, "OpenAI integration not configured");
        res.status(503).json({
          error:
            "AI interview features are not configured on this server. Please contact the administrator.",
        });
        return;
      }
      logger.error({ err }, "Failed to generate interview questions");
      res
        .status(502)
        .json({ error: "Failed to generate questions. Please try again." });
      return;
    }

    const [created] = await db
      .insert(interviewSessionsTable)
      .values({
        userId,
        role,
        level: data.level,
        focus: data.focus,
        company,
        notes: data.notes ?? null,
        applicationId,
        questions,
      })
      .returning();

    res.status(201).json(
      GetInterviewSessionResponse.parse({
        session: serializeSession(created, questions.length, 0),
        questions,
        answers: [],
      }),
    );
  },
);

router.get(
  "/interview/sessions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = GetInterviewSessionParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [session] = await db
      .select()
      .from(interviewSessionsTable)
      .where(
        and(
          eq(interviewSessionsTable.id, params.data.id),
          eq(interviewSessionsTable.userId, userId),
        ),
      );

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const answers = await db
      .select()
      .from(interviewAnswersTable)
      .where(eq(interviewAnswersTable.sessionId, session.id))
      .orderBy(desc(interviewAnswersTable.updatedAt));

    const questions = Array.isArray(session.questions) ? session.questions : [];

    res.json(
      GetInterviewSessionResponse.parse({
        session: serializeSession(session, questions.length, answers.length),
        questions,
        answers: answers.map(serializeAnswer),
      }),
    );
  },
);

router.delete(
  "/interview/sessions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = DeleteInterviewSessionParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const deleted = await db
      .delete(interviewSessionsTable)
      .where(
        and(
          eq(interviewSessionsTable.id, params.data.id),
          eq(interviewSessionsTable.userId, userId),
        ),
      )
      .returning({ id: interviewSessionsTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.status(204).send();
  },
);

router.post(
  "/interview/sessions/:id/answers",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = SubmitInterviewAnswerParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const parsed = SubmitInterviewAnswerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [session] = await db
      .select()
      .from(interviewSessionsTable)
      .where(
        and(
          eq(interviewSessionsTable.id, params.data.id),
          eq(interviewSessionsTable.userId, userId),
        ),
      );

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const questions = Array.isArray(session.questions) ? session.questions : [];
    const question = questions.find((q) => q.id === parsed.data.questionId);
    if (!question) {
      res.status(404).json({ error: "Question not found in this session" });
      return;
    }

    let feedback;
    try {
      feedback = await generateAnswerFeedback({
        role: session.role,
        level: session.level,
        questionType: question.type,
        questionText: question.text,
        answer: parsed.data.body,
      });
    } catch (err) {
      if (err instanceof InterviewAiUnavailableError) {
        logger.warn({ err: err.message }, "OpenAI integration not configured");
        res.status(503).json({
          error:
            "AI interview features are not configured on this server. Please contact the administrator.",
        });
        return;
      }
      logger.error({ err }, "Failed to generate AI feedback");
      res
        .status(502)
        .json({ error: "Failed to generate feedback. Please try again." });
      return;
    }

    const [existing] = await db
      .select()
      .from(interviewAnswersTable)
      .where(
        and(
          eq(interviewAnswersTable.sessionId, session.id),
          eq(interviewAnswersTable.questionId, question.id),
          eq(interviewAnswersTable.userId, userId),
        ),
      );

    let saved: InterviewAnswer;
    let isUpdate: boolean;
    if (existing) {
      isUpdate = true;
      const [updated] = await db
        .update(interviewAnswersTable)
        .set({
          body: parsed.data.body,
          questionText: question.text,
          feedback,
        })
        .where(eq(interviewAnswersTable.id, existing.id))
        .returning();
      saved = updated;
    } else {
      isUpdate = false;
      const [created] = await db
        .insert(interviewAnswersTable)
        .values({
          sessionId: session.id,
          userId,
          questionId: question.id,
          questionText: question.text,
          body: parsed.data.body,
          feedback,
        })
        .returning();
      saved = created;
    }

    // Touch the parent session's updatedAt so it sorts correctly.
    await db
      .update(interviewSessionsTable)
      .set({ updatedAt: new Date() })
      .where(eq(interviewSessionsTable.id, session.id));

    res.status(isUpdate ? 200 : 201).json(serializeAnswer(saved));
  },
);

export default router;
