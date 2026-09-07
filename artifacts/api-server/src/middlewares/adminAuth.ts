import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const adminEmails = configuredAdminEmails();
  if (adminEmails.size === 0) {
    req.log.error("ADMIN_EMAILS is not configured");
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress.toLowerCase();

    if (!email || !adminEmails.has(email)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    req.log.error({ err: error, userId }, "Failed to verify admin access");
    res.status(500).json({ error: "Unable to verify admin access" });
  }
}