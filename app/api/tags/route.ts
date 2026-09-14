import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { tags } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

export async function GET(){
  try{return Response.json({tags:await getDb().select().from(tags).orderBy(asc(tags.weight),asc(tags.name))})}
  catch{return Response.json({error:"Tags are temporarily unavailable."},{status:503})}
}

export async function POST(request:Request){
  try{
    await requireWorkspaceRole(["Admin","Manager"]);
    const p=await request.json() as {name?:string;color?:string;weight?:number};
    if(!p.name?.trim())return Response.json({error:"Tag name is required."},{status:400});
    const [tag]=await getDb().insert(tags).values({name:p.name.trim(),color:p.color||"#5b6fd8",weight:Math.max(1,Math.min(5,Number(p.weight)||2))}).returning();
    return Response.json({tag},{status:201});
  }catch(error){return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Only managers can create tags.":"Tag could not be created."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500})}
}
