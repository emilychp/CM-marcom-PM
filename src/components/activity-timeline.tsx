import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { taskHealthLabels } from "@/lib/status-labels"

const actionLabels: Record<string, string> = {
  CREATED: "建立了",
  UPDATED: "更新了",
  STATUS_CHANGED: "變更狀態",
  PROGRESS_UPDATED: "更新進度",
  MEMBER_ADDED: "加入成員",
  MEMBER_REMOVED: "移除成員",
  FIELD_VALUE_CHANGED: "更新自訂欄位",
  ATTACHMENT_ADDED: "上傳附件",
  ATTACHMENT_REMOVED: "刪除附件",
  HEALTH_CHANGED: "變更健康度",
  NOTE_UPDATED: "更新說明",
}

type ActivityEntry = {
  id: string
  action: string
  field: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: Date
  user: { name: string }
}

export function ActivityTimeline({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>異動歷史紀錄</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無異動紀錄</p>
        ) : (
          <ol className="space-y-3">
            {activity.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium">{entry.user.name}</span>{" "}
                <span className="text-muted-foreground">
                  {actionLabels[entry.action] ?? entry.action}
                  {entry.field && entry.field !== "health" ? `（${entry.field}）` : ""}
                  {(() => {
                    const format = (v: string) =>
                      entry.field === "health" ? (taskHealthLabels[v] ?? v) : v
                    if (entry.oldValue != null && entry.newValue != null) {
                      return `：${format(entry.oldValue)} → ${format(entry.newValue)}`
                    }
                    if (entry.newValue != null) {
                      return `：${format(entry.newValue)}`
                    }
                    return ""
                  })()}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("zh-TW")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
