import { getDb } from "@/db";
import { projectSteps } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function POST(request:Request){
  try{
    await requireWorkspaceRole(["Admin","Manager","Member"]);
    const p=await request.json() as {projectId?:number;title?:string;assignee?:string;due?:string;phase?:string;position?:number};
    if(!p.projectId||!p.title?.trim())return Response.json({error:"Project and step title are required"},{status:400});
    const [step]=await getDb().insert(projectSteps).values({projectId:p.projectId,title:p.title.trim(),assignee:p.assignee||"Unassigned",due:p.due||"Not set",phase:p.phase||"Plan",position:p.position||0}).returning();
    return Response.json({step},{status:201});
  }catch{return Response.json({error:"Step could not be added."},{status:500})}
}
