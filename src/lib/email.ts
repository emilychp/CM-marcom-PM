import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.REMINDER_FROM_EMAIL ?? "onboarding@resend.dev"

export async function sendWeeklyReminderEmail(params: {
  to: string
  ownerName: string
  appUrl: string
  projects: { id: string; name: string }[]
}) {
  if (!resend) throw new Error("RESEND_API_KEY not configured")

  const projectListHtml = params.projects
    .map(
      (p) =>
        `<li style="margin-bottom:6px"><a href="${params.appUrl}/projects/${p.id}" style="color:#2563eb;text-decoration:none">${p.name}</a></li>`
    )
    .join("")

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "【專案管理】每週進度更新提醒",
    html: `
      <div style="font-family:sans-serif;font-size:14px;color:#111;line-height:1.6">
        <p>${params.ownerName} 您好，</p>
        <p>提醒您更新以下負責專案的本週進度：</p>
        <ul>${projectListHtml}</ul>
        <p>
          <a href="${params.appUrl}/dashboard" style="color:#2563eb;text-decoration:none">
            前往專案儀表板 →
          </a>
        </p>
      </div>
    `,
  })
}
