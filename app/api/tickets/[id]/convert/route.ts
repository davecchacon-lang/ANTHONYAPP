import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, tickets } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireWorkspaceRole(["Admin","Manager"]); const {id}=await params; const db=getDb();
    const [ticket]=await db.select().from(tickets).where(eq(tickets.id,Number(id))).limit(1);
    if(!ticket)return Response.json({error:"Ticket not found."},{status:404});
    if(ticket.status==="Converted")return Response.json({error:"This ticket is already a project."},{status:409});
    const [project]=await db.insert(projects).values({name:ticket.title,description:ticket.description,category:ticket.category,owner:ticket.owner==="Unassigned"?"Operations Team":ticket.owner,status:"On track",due:"Not set",color:"#5b6fd8",progress:0,expectedProgress:0,priority:ticket.priority,tags:ticket.tags}).returning();
    const [updatedTicket]=await db.update(tickets).set({status:"Converted"}).where(eq(tickets.id,ticket.id)).returning();
    return Response.json({project,ticket:updatedTicket},{status:201});
  }catch(error){return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Only managers can convert tickets.":"Ticket could not be converted."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500})}
}
