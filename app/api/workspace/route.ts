import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, projectSteps, tasks, tickets } from "@/db/schema";
import { requireUser } from "@/lib/access";

export async function GET() {
  try {
    const identity = await requireUser();
    const db = await getDb();

    let projectRows = await db.select().from(projects).orderBy(asc(projects.id));
    if (!projectRows.length) {
      projectRows = await db.insert(projects).values([
        { name: "DAG Client Portal", description: "Launch a secure, clear client experience from intake through resolution.", category: "Client Experience", owner: "Operations Team", status: "On track", due: "Oct 18", color: "#5b6fd8", progress: 68, priority: "High" },
        { name: "ATLAS Campaign Engine", description: "Connect campaign planning, content, execution, and performance signals.", category: "Technology", owner: "Growth Team", status: "Watch", due: "Nov 7", color: "#8a5bd8", progress: 44, priority: "High" },
        { name: "Compliance Program", description: "Standardize policy, training, review, and audit readiness.", category: "Legal & Compliance", owner: "Compliance Team", status: "On track", due: "Dec 2", color: "#2c8b74", progress: 57, priority: "Urgent" },
        { name: "Customer Onboarding", description: "Reduce time-to-value and make every handoff visible.", category: "Operations", owner: "Client Success", status: "At risk", due: "Sep 30", color: "#d06a5b", progress: 31, priority: "Urgent" },
      ]).returning();
      const byName = Object.fromEntries(projectRows.map((p) => [p.name, p.id]));
      await db.insert(projectSteps).values([
        { projectId: byName["DAG Client Portal"], title: "Approve intake experience", status: "done", assignee: "Operations Team", due: "Sep 12", position: 1 },
        { projectId: byName["DAG Client Portal"], title: "Complete security review", status: "in_progress", assignee: "Technology Team", due: "Sep 20", position: 2 },
        { projectId: byName["ATLAS Campaign Engine"], title: "Lock Salesforce data map", status: "in_progress", assignee: "Growth Team", due: "Sep 16", position: 1 },
        { projectId: byName["Compliance Program"], title: "Publish policy library", status: "in_progress", assignee: "Compliance Team", due: "Oct 10", position: 1 },
        { projectId: byName["Customer Onboarding"], title: "Resolve intake handoff gap", status: "todo", assignee: "Client Success", due: "Sep 17", position: 1 },
      ]);
    }

    let taskRows = await db.select().from(tasks).orderBy(asc(tasks.id));
    if (!taskRows.length) {
      taskRows = await db.insert(tasks).values([
        { title: "Approve production release checklist", project: "ATLAS Campaign Engine", owner: identity.name, due: "Today", status: "open", impact: 3 },
        { title: "Review client portal intake copy", project: "DAG Client Portal", owner: identity.name, due: "Tomorrow", status: "open", impact: 1 },
        { title: "Confirm Salesforce field mapping", project: "ATLAS Campaign Engine", owner: identity.name, due: "Sep 16", status: "open", impact: 2 },
      ]).returning();
    }

    let ticketRows = await db.select().from(tickets).orderBy(asc(tickets.id));
    if (!ticketRows.length) {
      ticketRows = await db.insert(tickets).values([
        { kind: "request", title: "Add bulk document upload", description: "Allow intake staff to upload a complete document package.", priority: "High", status: "New", requester: "Client Success", owner: "Unassigned", created: "Today" },
        { kind: "idea", title: "AI-generated project brief", description: "Turn milestones and decisions into a weekly executive summary.", priority: "High", status: "New", requester: "Leadership", owner: "Unassigned", created: "Today" },
        { kind: "issue", title: "Salesforce activity timeline fails to load", description: "The timeline spins indefinitely on some account records.", priority: "Urgent", status: "New", requester: "Sales Team", owner: "Unassigned", created: "Today" },
      ]).returning();
    }

    const stepRows = await db.select().from(projectSteps).orderBy(asc(projectSteps.position));

    return Response.json({ identity, projects: projectRows, steps: stepRows, tasks: taskRows, tickets: ticketRows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Sign in to access this workspace." }, { status: 401 });
    }
    console.error(error);
    return Response.json({ error: "Workspace data is temporarily unavailable." }, { status: 503 });
  }
}
