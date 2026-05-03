import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const JOB_APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const jobApplicationsTable = pgTable(
  "job_applications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    link: text("link"),
    location: text("location"),
    salaryMin: text("salary_min"),
    salaryMax: text("salary_max"),
    source: text("source"),
    status: text("status").notNull().default("Saved").$type<JobApplicationStatus>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    resumeUrl: text("resume_url"),
    resumeName: text("resume_name"),
    coverLetterUrl: text("cover_letter_url"),
    coverLetterName: text("cover_letter_name"),
  },
  (table) => [
    index("job_applications_user_id_idx").on(table.userId),
    index("job_applications_status_idx").on(table.status),
  ],
);

export type JobApplication = typeof jobApplicationsTable.$inferSelect;
export type InsertJobApplication = typeof jobApplicationsTable.$inferInsert;

export const applicationNotesTable = pgTable(
  "application_notes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => jobApplicationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("application_notes_application_id_idx").on(table.applicationId),
    index("application_notes_user_id_idx").on(table.userId),
  ],
);

export type ApplicationNote = typeof applicationNotesTable.$inferSelect;
export type InsertApplicationNote = typeof applicationNotesTable.$inferInsert;
