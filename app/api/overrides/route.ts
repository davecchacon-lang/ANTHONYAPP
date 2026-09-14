import { getDb } from "@/db";
import { healthOverrides } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function POST(request: Request) {
  try {
    await requireWorkspaceRole(["Admin","Manager"]);
    const p=await request.json() as {project?:string;health?:string};
    if(!p.project||!p.health) return Response.json({error:"Missing value"},{status:400});
    const db=getDb();
    await db.insert(healthOverrides).values({project:p.project,health:p.health}).onConflictDoUpdate({target:healthOverrides.project,set:{health:p.health}});
    return Response.json({ok:true});
  } catch (error) { return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Your role cannot override project health.":"Override could not be saved."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500}); }
}
