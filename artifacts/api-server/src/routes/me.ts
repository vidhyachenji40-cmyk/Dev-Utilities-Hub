import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { GetMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  let user = existing[0];

  if (!user) {
    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let imageUrl: string | null = null;

    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;
      firstName = clerkUser.firstName ?? null;
      lastName = clerkUser.lastName ?? null;
      imageUrl = clerkUser.imageUrl ?? null;
    } catch (err) {
      req.log.warn({ err }, "Failed to fetch Clerk user profile");
    }

    const [created] = await db
      .insert(usersTable)
      .values({ id: userId, email, firstName, lastName, imageUrl })
      .returning();
    user = created;
  }

  res.json(
    GetMeResponse.parse({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

export default router;
