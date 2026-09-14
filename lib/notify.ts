import { getSlackToken } from "@/lib/integration-secrets";

type DeliveryResult = { sent: boolean; reason?: string };

function escapeHtml(value: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}

async function lookupSlackUserId(token: string, email: string) {
  const response = await fetch("https://slack.com/api/users.lookupByEmail?email=" + encodeURIComponent(email), {
    headers: { authorization: "Bearer " + token },
  });
  return (await response.json()) as { ok?: boolean; user?: { id?: string }; error?: string };
}

async function postSlackMessage(token: string, channel: string, text: string) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel, text }),
  });
  return (await response.json()) as { ok?: boolean };
}

export async function sendInviteEmail(email: string, name: string, role: string): Promise<DeliveryResult> {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM_EMAIL) {
    return { sent: false, reason: "email_not_configured" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFICATION_FROM_EMAIL,
        to: [email],
        subject: "You’ve been invited to Signal Project Manager",
        html: `<p>Hi ${escapeHtml(name)},</p><p>You’ve been invited to Signal Project Manager as a <strong>${escapeHtml(role)}</strong>. Sign in with this email address to get started.</p>`,
      }),
    });
    if (!response.ok) return { sent: false, reason: "provider_rejected" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "provider_rejected" };
  }
}

export async function sendSlackInvite(email: string, name: string, role: string, origin: string): Promise<DeliveryResult> {
  const token = await getSlackToken();
  if (!token) return { sent: false, reason: "slack_not_configured" };
  try {
    const lookup = await lookupSlackUserId(token, email);
    if (!lookup.ok || !lookup.user?.id) {
      return { sent: false, reason: lookup.error === "users_not_found" ? "slack_user_not_found" : "slack_lookup_failed" };
    }
    const message = await postSlackMessage(
      token,
      lookup.user.id,
      `Hi ${name}, you’ve been invited to Signal Project Manager as a ${role}. Sign in at ${origin} to get started.`,
    );
    if (!message.ok) return { sent: false, reason: "slack_delivery_failed" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "slack_lookup_failed" };
  }
}

export async function notifyMention(email: string, message: string, channels: string[]) {
  const delivered: string[] = [];
  const unavailable: string[] = [];

  if (channels.includes("Slack")) {
    let ok = false;
    const token = await getSlackToken();
    if (token) {
      try {
        const lookup = await lookupSlackUserId(token, email);
        if (lookup.ok && lookup.user?.id) {
          const post = await postSlackMessage(token, lookup.user.id, message);
          ok = Boolean(post.ok);
        }
      } catch {
        ok = false;
      }
    }
    (ok ? delivered : unavailable).push("Slack");
  }

  if (channels.includes("Email")) {
    let ok = false;
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" },
          body: JSON.stringify({
            from: process.env.NOTIFICATION_FROM_EMAIL,
            to: [email],
            subject: "You were mentioned in Signal Project Manager",
            html: `<p>${escapeHtml(message)}</p>`,
          }),
        });
        ok = response.ok;
      } catch {
        ok = false;
      }
    }
    (ok ? delivered : unavailable).push("Email");
  }

  return { email, delivered, unavailable };
}

