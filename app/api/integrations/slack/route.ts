import { requireWorkspaceRole } from "@/lib/access";
import { saveSlackToken } from "@/lib/integration-secrets";

export async function POST(request: Request) {
  try {
    const admin = await requireWorkspaceRole(["Admin"]);
    const { token } = await request.json() as { token?: string };
    const value = token?.trim() ?? "";
    if (!value.startsWith("xoxb-") || value.length < 20) return Response.json({ error: "Enter a valid Bot User OAuth Token." }, { status: 400 });
    const check = await fetch("https://slack.com/api/auth.test", { headers: { authorization: "Bearer " + value } });
    const result = await check.json() as { ok?: boolean; error?: string; team?: string };
    if (!result.ok) return Response.json({ error: result.error === "invalid_auth" ? "Slack rejected this token." : "Slack could not verify this token." }, { status: 400 });
    await saveSlackToken(value, admin.email);
    return Response.json({ connected: true, workspace: result.team ?? "Slack workspace" });
  } catch {
    return Response.json({ error: "Only a workspace administrator can connect Slack." }, { status: 403 });
  }
}
