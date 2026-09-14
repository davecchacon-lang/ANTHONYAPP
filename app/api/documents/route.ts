import { getStore } from "@netlify/blobs";
import { getDb } from "@/db";
import { projectDocuments } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
const allowed=new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel"]);
export async function POST(request:Request){
  try{
    const member=await requireWorkspaceRole(["Admin","Manager","Member"]);
    const form=await request.formData();
    const file=form.get("file");
    const projectId=Number(form.get("projectId"));
    if(!(file instanceof File)||!projectId)return Response.json({error:"File and project are required."},{status:400});
    if(!allowed.has(file.type)||file.size>25*1024*1024)return Response.json({error:"Use a PDF, Word, or Excel file up to 25 MB."},{status:400});
    const key="projects/"+projectId+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    await getStore("signal-documents").set(key,file,{metadata:{contentType:file.type}});
    const [document]=await getDb().insert(projectDocuments).values({projectId,name:file.name,objectKey:key,contentType:file.type,size:file.size,uploadedBy:member.name,created:"Today"}).returning();
    return Response.json({document},{status:201});
  }catch{return Response.json({error:"Document could not be uploaded."},{status:500})}
}
