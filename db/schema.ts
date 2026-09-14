import { index, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  project: text("project").notNull(),
  objective: text("objective").notNull(),
  owner: text("owner").notNull(),
  due: text("due").notNull(),
  status: text("status").notNull().default("ready"),
  waitingOn: text("waiting_on").notNull().default("[]"),
  impact: integer("impact").notNull().default(0),
  notes: text("notes").notNull().default(""),
});

export const healthOverrides = pgTable("health_overrides", {
  project: text("project").primaryKey(),
  health: text("health").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Operations"),
  owner: text("owner").notNull().default("Operations Team"),
  status: text("status").notNull().default("On track"),
  due: text("due").notNull().default("Not set"),
  color: text("color").notNull().default("#5b6fd8"),
  progress: integer("progress").notNull().default(0),
  expectedProgress: integer("expected_progress").notNull().default(50),
  priority: text("priority").notNull().default("Normal"),
  tags: text("tags").notNull().default("[]"),
}, table => [index("idx_projects_status").on(table.status), index("idx_projects_category").on(table.category)]);

export const projectSteps = pgTable("project_steps", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  phase: text("phase").notNull().default("Plan"),
  status: text("status").notNull().default("todo"),
  assignee: text("assignee").notNull().default("Unassigned"),
  due: text("due").notNull().default("Not set"),
  position: integer("position").notNull().default(0),
}, table => [index("idx_project_steps_project_position").on(table.projectId, table.position)]);

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("Member"),
  access: text("access").notNull().default("Assigned projects"),
  status: text("status").notNull().default("Active"),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("General"),
  priority: text("priority").notNull().default("Normal"),
  status: text("status").notNull().default("New"),
  requester: text("requester").notNull().default("Workspace member"),
  owner: text("owner").notNull().default("Unassigned"),
  created: text("created").notNull().default("Today"),
  tags: text("tags").notNull().default("[]"),
  exampleUrl: text("example_url").notNull().default(""),
  system: text("system").notNull().default(""),
}, table => [index("idx_tickets_kind_status").on(table.kind, table.status), index("idx_tickets_priority").on(table.priority)]);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#5b6fd8"),
  weight: integer("weight").notNull().default(2),
}, table => [index("idx_tags_weight").on(table.weight)]);

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  body: text("body").notNull(),
  author: text("author").notNull(),
  mentions: text("mentions").notNull().default("[]"),
  channels: text("channels").notNull().default("[]"),
  created: text("created").notNull().default("Today"),
}, table => [index("idx_project_notes_project").on(table.projectId)]);

export const projectDocuments = pgTable("project_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  created: text("created").notNull().default("Today"),
}, table => [index("idx_project_documents_project").on(table.projectId)]);

export const integrationCredentials = pgTable("integration_credentials", {
  key: text("key").primaryKey(),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});
