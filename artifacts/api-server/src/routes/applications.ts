import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  applicationNotesTable,
  db,
  jobApplicationsTable,
  JOB_APPLICATION_STATUSES,
  usersTable,
  type JobApplication,
  type ApplicationNote,
  type JobApplicationStatus,
} from "@workspace/db";
import {
  CreateApplicationBody,
  CreateApplicationNoteBody,
  CreateApplicationNoteParams,
  DeleteApplicationNoteParams,
  DeleteApplicationParams,
  GetApplicationParams,
  GetApplicationResponse,
  GetPipelineSummaryResponse,
  ListApplicationsResponse,
  UpdateApplicationBody,
  UpdateApplicationParams,
  UpdateApplicationResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serializeApplication(app: JobApplication) {
  return {
    id: app.id,
    company: app.company,
    role: app.role,
    link: app.link,
    location: app.location,
    salaryMin: app.salaryMin,
    salaryMax: app.salaryMax,
    source: app.source,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

async function ensureUserRecord(userId: string): Promise<void> {
  await db
    .insert(usersTable)
    .values({ id: userId, email: "default@jobtracker.com" })
    .onConflictDoNothing({ target: usersTable.id });
}

function serializeNote(note: ApplicationNote) {
  return {
    id: note.id,
    applicationId: note.applicationId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  };
}

router.get("/applications", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const applications = await db
    .select()
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.userId, userId))
    .orderBy(desc(jobApplicationsTable.updatedAt));

  res.json(
    ListApplicationsResponse.parse({
      applications: applications.map(serializeApplication),
    }),
  );
});

router.post("/applications", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const status: JobApplicationStatus = data.status ?? "Saved";

  await ensureUserRecord(userId);

  const [created] = await db
    .insert(jobApplicationsTable)
    .values({
      userId,
      company: data.company,
      role: data.role,
      link: data.link ?? null,
      location: data.location ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      source: data.source ?? null,
      status,
    })
    .returning();

  res.status(201).json(UpdateApplicationResponse.parse(serializeApplication(created)));
});

router.get(
  "/applications/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = GetApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const [app] = await db
      .select()
      .from(jobApplicationsTable)
      .where(
        and(
          eq(jobApplicationsTable.id, params.data.id),
          eq(jobApplicationsTable.userId, userId),
        ),
      );

    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const notes = await db
      .select()
      .from(applicationNotesTable)
      .where(eq(applicationNotesTable.applicationId, app.id))
      .orderBy(desc(applicationNotesTable.createdAt));

    res.json(
      GetApplicationResponse.parse({
        application: serializeApplication(app),
        notes: notes.map(serializeNote),
      }),
    );
  },
);

router.patch(
  "/applications/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = UpdateApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const parsed = UpdateApplicationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data = parsed.data;
    const updates: Partial<typeof jobApplicationsTable.$inferInsert> = {};

    if (data.company !== undefined) updates.company = data.company;
    if (data.role !== undefined) updates.role = data.role;
    if (data.link !== undefined) updates.link = data.link ?? null;
    if (data.location !== undefined) updates.location = data.location ?? null;
    if (data.salaryMin !== undefined) updates.salaryMin = data.salaryMin ?? null;
    if (data.salaryMax !== undefined) updates.salaryMax = data.salaryMax ?? null;
    if (data.source !== undefined) updates.source = data.source ?? null;
    if (data.status !== undefined) updates.status = data.status;

    if (Object.keys(updates).length === 0) {
      const [existing] = await db
        .select()
        .from(jobApplicationsTable)
        .where(
          and(
            eq(jobApplicationsTable.id, params.data.id),
            eq(jobApplicationsTable.userId, userId),
          ),
        );
      if (!existing) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json(UpdateApplicationResponse.parse(serializeApplication(existing)));
      return;
    }

    const [updated] = await db
      .update(jobApplicationsTable)
      .set(updates)
      .where(
        and(
          eq(jobApplicationsTable.id, params.data.id),
          eq(jobApplicationsTable.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.json(UpdateApplicationResponse.parse(serializeApplication(updated)));
  },
);

router.delete(
  "/applications/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = DeleteApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const deleted = await db
      .delete(jobApplicationsTable)
      .where(
        and(
          eq(jobApplicationsTable.id, params.data.id),
          eq(jobApplicationsTable.userId, userId),
        ),
      )
      .returning({ id: jobApplicationsTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.status(204).send();
  },
);

router.post(
  "/applications/:id/notes",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = CreateApplicationNoteParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const parsed = CreateApplicationNoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [app] = await db
      .select({ id: jobApplicationsTable.id })
      .from(jobApplicationsTable)
      .where(
        and(
          eq(jobApplicationsTable.id, params.data.id),
          eq(jobApplicationsTable.userId, userId),
        ),
      );

    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const [created] = await db
      .insert(applicationNotesTable)
      .values({
        applicationId: app.id,
        userId,
        body: parsed.data.body,
      })
      .returning();

    await db
      .update(jobApplicationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(jobApplicationsTable.id, app.id));

    res.status(201).json(serializeNote(created));
  },
);

router.delete(
  "/applications/:id/notes/:noteId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;
    const params = DeleteApplicationNoteParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const deleted = await db
      .delete(applicationNotesTable)
      .where(
        and(
          eq(applicationNotesTable.id, params.data.noteId),
          eq(applicationNotesTable.applicationId, params.data.id),
          eq(applicationNotesTable.userId, userId),
        ),
      )
      .returning({ id: applicationNotesTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    res.status(204).send();
  },
);

router.get(
  "/pipeline-summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.userId!;

    const counts = await db
      .select({
        status: jobApplicationsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.userId, userId))
      .groupBy(jobApplicationsTable.status);

    const countByStatus = new Map<string, number>();
    for (const row of counts) {
      countByStatus.set(row.status, Number(row.count));
    }

    const stages = JOB_APPLICATION_STATUSES.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));

    const total = stages.reduce((sum, s) => sum + s.count, 0);

    const recent = await db
      .select({
        id: jobApplicationsTable.id,
        company: jobApplicationsTable.company,
        role: jobApplicationsTable.role,
        status: jobApplicationsTable.status,
        updatedAt: jobApplicationsTable.updatedAt,
      })
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.userId, userId))
      .orderBy(desc(jobApplicationsTable.updatedAt))
      .limit(5);

    res.json(
      GetPipelineSummaryResponse.parse({
        total,
        stages,
        recentActivity: recent.map((r) => ({
          applicationId: r.id,
          company: r.company,
          role: r.role,
          status: r.status,
          updatedAt: r.updatedAt.toISOString(),
        })),
      }),
    );
  },
);

export default router;
