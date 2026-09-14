import { requireWorkspaceRole } from "@/lib/access";
import { hasSlackToken } from "@/lib/integration-secrets";

export async function GET(){
  try{
    await requireWorkspaceRole(["Admin","Manager","Member","Viewer"]);
    return Response.json({
      slack:{connected:await hasSlackToken()},
      email:{connected:Boolean(process.env.RESEND_API_KEY&&process.env.NOTIFICATION_FROM_EMAIL)},
    });
  }catch{return Response.json({error:"Integration status is unavailable."},{status:403})}
}
