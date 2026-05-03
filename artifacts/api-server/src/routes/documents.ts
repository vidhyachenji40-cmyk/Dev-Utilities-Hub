// artifacts/api-server/src/routes/documents.ts
// Add this route to handle resume & cover letter uploads per application
//
// SETUP:
// 1. Install multer:  pnpm --filter @workspace/api-server add multer
//                     pnpm --filter @workspace/api-server add -D @types/multer
// 2. Add this file to artifacts/api-server/src/routes/documents.ts
// 3. Mount it in your main router (index.ts or app.ts):
//    import documentsRouter from "./routes/documents.js";
//    app.use("/api/applications", documentsRouter);
//
// 4. Add these columns to your DB schema (lib/db/src/schema/index.ts):
//    resumeUrl:     text("resume_url"),
//    resumeName:    text("resume_name"),
//    coverLetterUrl:    text("cover_letter_url"),
//    coverLetterName:   text("cover_letter_name"),
//
// 5. Run:  pnpm --filter @workspace/db run push
//
// Files are stored locally in /uploads/ — swap to S3/R2 if you prefer cloud storage.

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middlewares/requireAuth.js";
import { db } from "@workspace/db";
import { jobApplications } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// ── Storage config ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX files are allowed"));
    }
  }
});

// ── POST /api/applications/:id/documents ─────────────────────────────────────
// Upload resume and/or cover letter for a specific application
router.post(
  "/:id/documents",
  requireAuth,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "coverLetter", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.userId as string;
      const files = req.files as Record<string, Express.Multer.File[]>;

      // Verify the application belongs to this user
      const [app] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)));

      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      const updates: Record<string, string> = {};

      if (files.resume?.[0]) {
        const f = files.resume[0];
        updates.resumeUrl = `/api/documents/${f.filename}`;
        updates.resumeName = f.originalname;
      }

      if (files.coverLetter?.[0]) {
        const f = files.coverLetter[0];
        updates.coverLetterUrl = `/api/documents/${f.filename}`;
        updates.coverLetterName = f.originalname;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const [updated] = await db
        .update(jobApplications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(jobApplications.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Document upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// ── GET /api/documents/:filename ─────────────────────────────────────────────
// Serve uploaded files (authenticated)
router.get("/documents/:filename", requireAuth, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  res.download(filePath);
});

export default router;
