import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projectSteps } from "@/db/schema";
import { requireUser } from "@/lib/access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const p = (await request.json()) as { status?: string };
    if (!p.status) return Response.json({ error: "Status is required" }, { status: 400 });
    const [step] = await (await getDb()).update(projectSteps).set({ status: p.status }).where(eq(projectSteps.id, Number(id))).returning();
    return step ? Response.json({ step }) : Response.json({ error: "Step not found." }, { status: 404 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Step could not be updated." }, { status: 500 });
  }
}

