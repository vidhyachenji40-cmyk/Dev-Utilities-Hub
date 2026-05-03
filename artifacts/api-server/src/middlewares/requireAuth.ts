import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      auth?: any;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.userId = "00000000-0000-0000-0000-000000000001";
  req.auth = { userId: "00000000-0000-0000-0000-000000000001" };
  next();
}
