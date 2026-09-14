import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { healthOverrides, tasks } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";

const seed = [
  ["Approve production release checklist","ATLAS","Campaign orchestration v2","Anthony","Today","ready","[]",2],
  ["Review client portal intake copy","DAG Law","Client portal launch","Anthony","Tomorrow","ready","[]",1],
  ["Confirm Salesforce field mapping","ATLAS","Campaign orchestration v2","Anthony","Sep 16","ready","[]",3],
  ["Legal review of SMS consent language","DAG Law","Client portal launch","Maya Chen","Sep 11","waiting","[\"Maya Chen\"]",3],
  ["Vendor security questionnaire","DAG Law","Client portal launch","Chris Muckley","Sep 18","waiting","[\"Chirp support\"]",1],
  ["Data retention policy","ATLAS","Campaign orchestration v2","Anthony","Sep 9","done","[]",0],
] as const;

export async function GET() {
  try {
    const db = getDb();
    let rows = await db.select().from(tasks).orderBy(asc(tasks.id));
    if (!rows.length) {
      await db.insert(tasks).values(seed.map(([title,project,objective,owner,due,status,waitingOn,impact]) => ({title,project,objective,owner,due,status,waitingOn,impact})));
      rows = await db.select().from(tasks).orderBy(asc(tasks.id));
    }
    const overrideRows = await db.select().from(healthOverrides);
    return Response.json({ tasks: rows, overrides: Object.fromEntries(overrideRows.map(r => [r.project, r.health])) });
  } catch { return Response.json({ error: "Project data is temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    await requireWorkspaceRole(["Admin","Manager","Member"]);
    const p = await request.json() as Record<string, unknown>;
    if (!String(p.title ?? "").trim()) return Response.json({error:"Title is required"},{status:400});
    const db = getDb();
    const [task] = await db.insert(tasks).values({ title:String(p.title), project:String(p.project), objective:String(p.objective), owner:String(p.owner), due:String(p.due), status:String(p.status), waitingOn:JSON.stringify(p.waitingOn ?? []), impact:Number(p.impact ?? 0) }).returning();
    return Response.json({task},{status:201});
  } catch { return Response.json({error:"Task could not be saved."},{status:500}); }
}
