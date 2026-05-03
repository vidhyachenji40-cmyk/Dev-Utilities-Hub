import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middlewares/requireAuth.js";
import { db } from "@workspace/db";
import { jobApplicationsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

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
  limits: { fileSize: 10 * 1024 * 1024 },
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

      const [app] = await db
        .select()
        .from(jobApplicationsTable)
        .where(and(eq(jobApplicationsTable.id, id), eq(jobApplicationsTable.userId, userId)));

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
        .update(jobApplicationsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(jobApplicationsTable.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Document upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

router.get("/documents/:filename", requireAuth, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  res.download(filePath);
});

export default router;
