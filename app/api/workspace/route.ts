import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { members, projects, projectDocuments, projectNotes, projectSteps, tags, tasks, tickets } from "@/db/schema";
import { getCurrentIdentity } from "@/lib/access";

export async function GET() {
  try {
    const identity = await getCurrentIdentity();
    if (!identity) return Response.json({error:"Sign in to access this workspace."},{status:401});
    const db = getDb();
    await db.delete(tasks).where(inArray(tasks.project, ["Funding Metrics", "Lendini"]));
    let projectRows = await db.select().from(projects).orderBy(asc(projects.id));
    if (!projectRows.length) {
      projectRows = await db.insert(projects).values([
        { name:"DAG Client Portal", description:"Launch a secure, clear client experience from intake through resolution.", category:"Client Experience", owner:"Operations Team", status:"On track", due:"Oct 18", color:"#5b6fd8", progress:68 },
        { name:"ATLAS Campaign Engine", description:"Connect campaign planning, content, execution, and performance signals.", category:"Technology", owner:"Growth Team", status:"Watch", due:"Nov 7", color:"#8a5bd8", progress:44 },
        { name:"Compliance Program", description:"Standardize policy, training, review, and audit readiness.", category:"Legal & Compliance", owner:"Compliance Team", status:"On track", due:"Dec 2", color:"#2c8b74", progress:57 },
        { name:"Customer Onboarding", description:"Reduce time-to-value and make every handoff visible.", category:"Operations", owner:"Client Success", status:"At risk", due:"Sep 30", color:"#d06a5b", progress:31 },
      ]).returning();
      const p = Object.fromEntries(projectRows.map(row => [row.name, row.id]));
      await db.insert(projectSteps).values([
        {projectId:p["DAG Client Portal"],title:"Approve intake experience",phase:"Plan",status:"done",assignee:"Operations Team",due:"Sep 12",position:1},
        {projectId:p["DAG Client Portal"],title:"Complete security review",phase:"Build",status:"in_progress",assignee:"Technology Team",due:"Sep 20",position:2},
        {projectId:p["DAG Client Portal"],title:"Pilot with internal users",phase:"Launch",status:"todo",assignee:"Client Success",due:"Oct 4",position:3},
        {projectId:p["ATLAS Campaign Engine"],title:"Lock Salesforce data map",phase:"Plan",status:"in_progress",assignee:"Growth Team",due:"Sep 16",position:1},
        {projectId:p["ATLAS Campaign Engine"],title:"Connect email orchestration",phase:"Build",status:"todo",assignee:"Technology Team",due:"Oct 3",position:2},
        {projectId:p["Compliance Program"],title:"Publish policy library",phase:"Build",status:"in_progress",assignee:"Compliance Team",due:"Oct 10",position:1},
        {projectId:p["Customer Onboarding"],title:"Resolve intake handoff gap",phase:"Build",status:"blocked",assignee:"Client Success",due:"Sep 17",position:1},
      ]);
    }
    let memberRows = await db.select().from(members).orderBy(asc(members.id));
    if (!memberRows.length) {
      memberRows = await db.insert(members).values({name:identity.name,email:identity.email.toLowerCase(),role:"Admin",access:"All projects",status:"Active"}).returning();
    } else if (!await db.select({id:members.id}).from(members).where(eq(members.email,identity.email.toLowerCase())).limit(1).then(rows=>rows[0])) {
      return Response.json({error:"Your account has not been invited to this workspace."},{status:403});
    }
    let ticketRows = await db.select().from(tickets).orderBy(asc(tickets.id));
    if (!ticketRows.length) ticketRows = await db.insert(tickets).values([
      {kind:"request",title:"Add bulk document upload",description:"Allow intake staff to upload a complete document package.",category:"Product",priority:"High",status:"In review",requester:"Client Success",owner:"Product Team",created:"Today"},
      {kind:"request",title:"Update weekly portfolio export",description:"Include owner and risk signal columns.",category:"Reporting",priority:"Normal",status:"New",requester:"Operations",owner:"Unassigned",created:"Yesterday"},
      {kind:"idea",title:"AI-generated project brief",description:"Turn milestones and decisions into a weekly executive summary.",category:"Automation",priority:"High",status:"Evaluating",requester:"Leadership",owner:"Product Team",created:"Today"},
      {kind:"idea",title:"Meeting-to-project converter",description:"Create a draft plan from meeting notes and assigned actions.",category:"Collaboration",priority:"Normal",status:"Planned",requester:"Operations",owner:"Technology Team",created:"Sep 12"},
    ]).returning();
    let tagRows = await db.select().from(tags).orderBy(asc(tags.weight),asc(tags.name));
    if (!tagRows.length) tagRows = await db.insert(tags).values([
      {name:"Customer impact",color:"#5b6fd8",weight:4},
      {name:"Revenue",color:"#2c8b74",weight:4},
      {name:"Compliance",color:"#d05d59",weight:5},
      {name:"Quick win",color:"#d39a38",weight:2},
    ]).returning();
    const stepRows = await db.select().from(projectSteps).orderBy(asc(projectSteps.position));
    const noteRows = await db.select().from(projectNotes).orderBy(asc(projectNotes.id));
    const documentRows = await db.select().from(projectDocuments).orderBy(asc(projectDocuments.id));
    return Response.json({projects:projectRows,steps:stepRows,members:memberRows,tickets:ticketRows,tags:tagRows,notes:noteRows,documents:documentRows});
  } catch { return Response.json({error:"Workspace data is temporarily unavailable."},{status:503}); }
}
