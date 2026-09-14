import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members } from "@/db/schema";

export type Identity = { email: string; name: string };

// Reads the signed-in Netlify Identity user from the request's nf_jwt cookie.
// getUser() needs no arguments — the Netlify runtime supplies request context.
export async function getCurrentIdentity(): Promise<Identity | null> {
  const user = await getUser();
  if (!user?.email) return null;
  return {
    email: user.email.toLowerCase(),
    name: user.name?.trim() || user.email.split("@")[0],
  };
}

// Every workspace member is matched to their Netlify Identity session by email.
// Throws "FORBIDDEN" (mapped to a 403 by every route that calls this) when the
// visitor isn't signed in, isn't a workspace member, or holds the wrong role.
export async function requireWorkspaceRole(allowedRoles: string[]) {
  const identity = await getCurrentIdentity();
  if (!identity) throw new Error("FORBIDDEN");

  const db = getDb();
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.email, identity.email))
    .limit(1);

  if (!member || !allowedRoles.includes(member.role)) throw new Error("FORBIDDEN");
  return member;
}
