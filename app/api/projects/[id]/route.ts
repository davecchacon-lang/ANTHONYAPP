import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireWorkspaceRole(["Admin","Manager"]);
    const {id}=await params; const p=await request.json() as Record<string,unknown>;
    const allowed:Record<string,unknown>={};
    for(const key of ["name","description","category","owner","status","due","color","priority","tags"] as const)if(typeof p[key]==="string")allowed[key]=p[key];
    for(const key of ["progress","expectedProgress"] as const)if(Number.isFinite(Number(p[key])))allowed[key]=Math.max(0,Math.min(100,Number(p[key])));
    const [project]=await getDb().update(projects).set(allowed).where(eq(projects.id,Number(id))).returning();
    return project?Response.json({project}):Response.json({error:"Project not found."},{status:404});
  }catch(error){return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Only managers can change project priority.":"Project could not be updated."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500})}
}
