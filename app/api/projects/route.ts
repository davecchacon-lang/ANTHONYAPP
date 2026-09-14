import { getDb } from "@/db";
import { projects, projectSteps } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function POST(request: Request) {
  try {
    await requireWorkspaceRole(["Admin","Manager"]);
    const p=await request.json() as {name?:string;description?:string;category?:string;owner?:string;due?:string;steps?:string[]};
    if(!p.name?.trim()) return Response.json({error:"Project name is required"},{status:400});
    const db=getDb();
    const [project]=await db.insert(projects).values({name:p.name.trim(),description:p.description??"",category:p.category??"Operations",owner:p.owner??"Operations Team",due:p.due??"Not set",status:"On track",progress:0,color:"#5b6fd8"}).returning();
    if(p.steps?.length) await db.insert(projectSteps).values(p.steps.filter(Boolean).map((title,i)=>({projectId:project.id,title,phase:i===0?"Plan":"Build",position:i+1})));
    return Response.json({project},{status:201});
  } catch { return Response.json({error:"Project could not be created."},{status:500}); }
}
