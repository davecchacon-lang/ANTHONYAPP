import { getUser } from "@netlify/identity";

export type Identity = { email: string; name: string };

// Reads the signed-in Netlify Identity user from the request's nf_jwt cookie.
export async function getCurrentIdentity(): Promise<Identity | null> {
  const user = await getUser();
  if (!user?.email) return null;
  return {
    email: user.email.toLowerCase(),
    name: user.name?.trim() || user.email.split("@")[0],
  };
}

// Everyone who is signed in can use the workspace — there is no separate
// role/member system to manage.
export async function requireUser(): Promise<Identity> {
  const identity = await getCurrentIdentity();
  if (!identity) throw new Error("UNAUTHORIZED");
  return identity;
}
