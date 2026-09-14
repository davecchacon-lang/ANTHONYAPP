import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireWorkspaceRole(["Admin","Manager","Member"]);
    const {id}=await params; const p=await request.json() as Record<string,unknown>; const allowed:Record<string,string>={};
    for(const key of ["title","description","category","priority","status","owner","tags","exampleUrl","system"] as const)if(typeof p[key]==="string")allowed[key]=p[key] as string;
    const [ticket]=await getDb().update(tickets).set(allowed).where(eq(tickets.id,Number(id))).returning();
    return ticket?Response.json({ticket}):Response.json({error:"Ticket not found."},{status:404});
  }catch(error){return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Your role cannot edit tickets.":"Ticket could not be updated."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500})}
}
