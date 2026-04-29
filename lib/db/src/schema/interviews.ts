import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { jobApplicationsTable } from "./jobApplications";

export const INTERVIEW_FOCUS_OPTIONS = [
  "Behavioral",
  "Technical",
  "Mixed",
] as const;

export type InterviewFocus = (typeof INTERVIEW_FOCUS_OPTIONS)[number];

export const INTERVIEW_LEVEL_OPTIONS = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Staff",
] as const;

export type InterviewLevel = (typeof INTERVIEW_LEVEL_OPTIONS)[number];

export const INTERVIEW_QUESTION_TYPES = ["Behavioral", "Technical"] as const;

export type InterviewQuestionType = (typeof INTERVIEW_QUESTION_TYPES)[number];

export type InterviewQuestion = {
  id: string;
  type: InterviewQuestionType;
  text: string;
  starHint?: string;
};

export type InterviewFeedback = {
  clarity: number;
  structure: number;
  specificity: number;
  summary: string;
  strengths: string[];
  improvements: string[];
};

export const interviewSessionsTable = pgTable(
  "interview_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    level: text("level").notNull().$type<InterviewLevel>(),
    focus: text("focus").notNull().$type<InterviewFocus>(),
    company: text("company"),
    notes: text("notes"),
    applicationId: uuid("application_id").references(
      () => jobApplicationsTable.id,
      { onDelete: "set null" },
    ),
    questions: jsonb("questions")
      .notNull()
      .$type<InterviewQuestion[]>()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("interview_sessions_user_id_idx").on(table.userId),
    index("interview_sessions_application_id_idx").on(table.applicationId),
  ],
);

export type InterviewSession = typeof interviewSessionsTable.$inferSelect;
export type InsertInterviewSession =
  typeof interviewSessionsTable.$inferInsert;

export const interviewAnswersTable = pgTable(
  "interview_answers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    questionText: text("question_text").notNull(),
    body: text("body").notNull(),
    feedback: jsonb("feedback").$type<InterviewFeedback>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("interview_answers_session_id_idx").on(table.sessionId),
    index("interview_answers_user_id_idx").on(table.userId),
    uniqueIndex("interview_answers_session_question_user_unique").on(
      table.sessionId,
      table.questionId,
      table.userId,
    ),
  ],
);

export type InterviewAnswer = typeof interviewAnswersTable.$inferSelect;
export type InsertInterviewAnswer =
  typeof interviewAnswersTable.$inferInsert;
