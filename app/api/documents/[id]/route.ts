import { getStore } from "@netlify/blobs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projectDocuments } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  await requireWorkspaceRole(["Admin","Manager","Member","Viewer"]);
  const {id}=await context.params;
  const [document]=await getDb().select().from(projectDocuments).where(eq(projectDocuments.id,Number(id))).limit(1);
  if(!document)return new Response("Not found",{status:404});
  const object=await getStore("signal-documents").get(document.objectKey,{type:"blob"});
  if(!object)return new Response("Not found",{status:404});
  return new Response(object,{headers:{"content-type":document.contentType,"content-disposition":'attachment; filename="'+document.name.replace(/"/g,"")+'"'}});
}
