import type { Request, Response, NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      auth?: any;
    }
  }
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Try Bearer token first (for extension)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = await clerkClient.verifyToken(token);
        if (payload?.sub) {
          req.userId = payload.sub;
          req.auth = { userId: payload.sub };
          next();
          return;
        }
      } catch (e) {
        // Token invalid, fall through to cookie auth
      }
    }

    // Fall back to cookie/session auth
    const auth = getAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.userId = String(userId);
    req.auth = auth;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
