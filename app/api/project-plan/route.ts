import { getStore } from "@netlify/blobs";
import { eq } from "drizzle-orm";
import { extractText } from "unpdf";
import { getDb } from "@/db";
import { projectDocuments, projects, tasks } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

function taskLines(text:string){
  const cleaned=text.split(/\r?\n/).map(line=>line.replace(/^\s*(?:[-•●▪◦*]|\d+[.)])\s*/,"").replace(/\s+/g," ").trim()).filter(line=>line.length>=8&&line.length<=180);
  const action=/^(?:create|build|review|approve|confirm|prepare|publish|design|develop|test|launch|complete|finalize|schedule|send|update|define|audit|map|implement|draft|resolve|coordinate|document|deliver|set up|configure)\b/i;
  const candidates=cleaned.filter(line=>action.test(line)||/\b(owner|due|task|action item|deliverable)\b/i.test(line));
  return [...new Set((candidates.length>=3?candidates:cleaned).filter(line=>!/^page \d+$/i.test(line)))].slice(0,30);
}

export async function POST(request:Request){
  try{
    const member=await requireWorkspaceRole(["Admin","Manager","Member"]);
    const form=await request.formData(); const file=form.get("file"); const projectId=Number(form.get("projectId"));
    if(!(file instanceof File)||file.type!=="application/pdf"||!projectId)return Response.json({error:"Choose a PDF and project."},{status:400});
    if(file.size>25*1024*1024)return Response.json({error:"PDFs must be 25 MB or smaller."},{status:400});
    const db=getDb(); const [project]=await db.select().from(projects).where(eq(projects.id,projectId)).limit(1);
    if(!project)return Response.json({error:"Project not found."},{status:404});
    const bytes=new Uint8Array(await file.arrayBuffer()); const extracted=await extractText(bytes,{mergePages:true}); const lines=taskLines(extracted.text);
    if(!lines.length)return Response.json({error:"No task-like lines were found. Try a text-based project plan PDF."},{status:422});
    const key="projects/"+projectId+"/plans/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    await getStore("signal-documents").set(key,bytes.buffer,{metadata:{contentType:file.type}});
    const [document]=await db.insert(projectDocuments).values({projectId,name:file.name,objectKey:key,contentType:file.type,size:file.size,uploadedBy:member.name,created:"Today"}).returning();
    const createdTasks=await db.insert(tasks).values(lines.map(title=>({title,project:project.name,objective:"Imported project plan",owner:"Unassigned",due:"Not set",status:"ready",waitingOn:"[]",impact:1,notes:"Imported from "+file.name}))).returning();
    return Response.json({document,tasks:createdTasks,pages:extracted.totalPages},{status:201});
  }catch(error){console.error(error);return Response.json({error:"The PDF could not be read. Make sure it contains selectable text."},{status:500})}
}
