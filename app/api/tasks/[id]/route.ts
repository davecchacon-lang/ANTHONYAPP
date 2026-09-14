import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireWorkspaceRole(["Admin","Manager","Member"]);
    const {id}=await context.params;
    const p=await request.json() as {status?:string;owner?:string;due?:string;notes?:string};
    const db=getDb();
    const changes:{status?:string;owner?:string;due?:string;notes?:string}={};
    if(p.status!==undefined)changes.status=p.status;
    if(p.owner!==undefined)changes.owner=p.owner;
    if(p.due!==undefined)changes.due=p.due;
    if(p.notes!==undefined)changes.notes=p.notes;
    await db.update(tasks).set(changes).where(eq(tasks.id,Number(id)));
    return Response.json({ok:true});
  } catch (error) { return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Your role cannot update tasks.":"Task could not be updated."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500}); }
}
