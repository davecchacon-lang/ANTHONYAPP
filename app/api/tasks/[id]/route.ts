import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const p = (await request.json()) as Record<string, unknown>;
    const changes: Record<string, unknown> = {};
    for (const key of ["status", "owner", "due", "title"] as const) if (typeof p[key] === "string") changes[key] = p[key];
    if (typeof p.impact === "number") changes.impact = p.impact;
    const [task] = await (await getDb()).update(tasks).set(changes).where(eq(tasks.id, Number(id))).returning();
    return task ? Response.json({ task }) : Response.json({ error: "Task not found." }, { status: 404 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Task could not be updated." }, { status: 500 });
  }
}
