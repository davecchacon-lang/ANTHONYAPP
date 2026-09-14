import { getDb } from "@/db";
import { members } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/access";
import { sendInviteEmail, sendSlackInvite } from "@/lib/notify";
export async function POST(request: Request) {
  try {
    await requireWorkspaceRole(["Admin"]);
    const p=await request.json() as Record<string,string>;
    if(!p.email?.includes("@")) return Response.json({error:"A valid email is required"},{status:400});
    const db=getDb();
    const [member]=await db.insert(members).values({name:p.name||p.email.split("@")[0],email:p.email.toLowerCase(),role:p.role||"Member",access:p.access||"Assigned projects",status:"Invited"}).returning();
    const method=p.delivery||"Slack";
    const emailDelivery=method==="Email"||method==="Slack + email"?await sendInviteEmail(member.email,member.name,member.role):{sent:false,reason:"not_requested"};
    const slackDelivery=method==="Slack"||method==="Slack + email"?await sendSlackInvite(member.email,member.name,member.role,new URL(request.url).origin):{sent:false,reason:"not_requested"};
    return Response.json({member,emailSent:emailDelivery.sent,emailReason:"reason" in emailDelivery?emailDelivery.reason:null,slackSent:slackDelivery.sent,slackReason:"reason" in slackDelivery?slackDelivery.reason:null},{status:201});
  } catch (error) { return Response.json({error:error instanceof Error&&error.message==="FORBIDDEN"?"Only admins can invite members.":"Member could not be invited."},{status:error instanceof Error&&error.message==="FORBIDDEN"?403:500}); }
}
