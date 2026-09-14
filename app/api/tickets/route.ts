import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
export async function POST(request: Request) {
  try {
    const member=await requireWorkspaceRole(["Admin","Manager","Member"]);
    const p=await request.json() as Record<string,string>;
    if(!p.title?.trim()) return Response.json({error:"Title is required"},{status:400});
    const db=getDb();
    const [ticket]=await db.insert(tickets).values({kind:p.kind,title:p.title.trim(),description:p.description??"",category:p.category??"General",priority:p.priority??"Normal",status:"New",requester:member.name,owner:"Unassigned",created:"Today",tags:p.tags??"[]",system:p.system??"",exampleUrl:p.exampleUrl??""}).returning();
    return Response.json({ticket},{status:201});
  } catch (error) { return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Your role cannot create tickets.":"Ticket could not be created."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500}); }
}
