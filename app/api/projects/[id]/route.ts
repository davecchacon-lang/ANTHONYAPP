import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const p = (await request.json()) as Record<string, unknown>;
    const changes: Record<string, unknown> = {};
    for (const key of ["name", "description", "category", "owner", "status", "due", "color", "priority"] as const) if (typeof p[key] === "string") changes[key] = p[key];
    if (Number.isFinite(Number(p.progress))) changes.progress = Math.max(0, Math.min(100, Number(p.progress)));
    const [project] = await (await getDb()).update(projects).set(changes).where(eq(projects.id, Number(id))).returning();
    return project ? Response.json({ project }) : Response.json({ error: "Project not found." }, { status: 404 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Project could not be updated." }, { status: 500 });
  }
}
