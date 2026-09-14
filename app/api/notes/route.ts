import { getDb } from "@/db";
import { projectNotes } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
import { notifyMention } from "@/lib/notify";
export async function POST(request:Request){
  try{
    const member=await requireWorkspaceRole(["Admin","Manager","Member"]);
    const p=await request.json() as {projectId?:number;body?:string;mentions?:string[];channels?:string[]};
    if(!p.projectId||!p.body?.trim())return Response.json({error:"A note is required"},{status:400});
    const [note]=await getDb().insert(projectNotes).values({projectId:p.projectId,body:p.body.trim(),author:member.name,mentions:JSON.stringify(p.mentions||[]),channels:JSON.stringify(p.channels||[]),created:"Today"}).returning();
    const message=member.name+" mentioned you in a Signal project note: "+p.body.trim();
    const delivery=await Promise.all((p.mentions||[]).map(email=>notifyMention(email,message,p.channels||[]).catch(()=>({email,delivered:[],unavailable:p.channels||[]}))));
    return Response.json({note,delivery},{status:201});
  }catch{return Response.json({error:"Note could not be saved."},{status:500})}
}
