import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { requireUser } from "@/lib/access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const p = (await request.json()) as Record<string, unknown>;
    const changes: Record<string, unknown> = {};
    for (const key of ["title", "description", "priority", "status", "owner"] as const) if (typeof p[key] === "string") changes[key] = p[key];
    const [ticket] = await (await getDb()).update(tickets).set(changes).where(eq(tickets.id, Number(id))).returning();
    return ticket ? Response.json({ ticket }) : Response.json({ error: "Ticket not found." }, { status: 404 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Ticket could not be updated." }, { status: 500 });
  }
}
