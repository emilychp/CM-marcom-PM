import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { taskHealthLabels, projectPriorityLabels } from "@/lib/status-labels"

const actionLabels: Record<string, string> = {
  CREATED: "建立了",
  UPDATED: "更新了",
  STATUS_CHANGED: "變更狀態",
  PROGRESS_UPDATED: "更新進度",
  MEMBER_ADDED: "加入成員",
  MEMBER_REMOVED: "移除成員",
  MEMBER_ROLE_CHANGED: "變更成員角色",
  FIELD_VALUE_CHANGED: "更新自訂欄位",
  ATTACHMENT_ADDED: "上傳附件",
  ATTACHMENT_REMOVED: "刪除附件",
  HEALTH_CHANGED: "變更健康度",
  NOTE_UPDATED: "更新說明",
  PRIORITY_CHANGED: "變更優先性",
  NAME_CHANGED: "變更專案名稱",
  OWNER_CHANGED: "變更負責人",
  DESCRIPTION_CHANGED: "更新專案說明",
  COMMENT_ADDED: "發表留言",
  COMMENT_REMOVED: "刪除留言",
  MEETING_NOTE_ADDED: "新增會議記錄",
  MEETING_NOTE_UPDATED: "更新會議記錄",
  MEETING_NOTE_REMOVED: "刪除會議記錄",
}

const fieldLabels: Record<string, string> = {
  phase_renamed: "階段名稱",
  phase_schedule: "階段時程",
  project_dates: "專案時程",
  meeting_note: "會議記錄",
}

const noSuffixFields = new Set(["health", "priority", "name", "owner"])

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
                  {entry.field && !noSuffixFields.has(entry.field)
                    ? `（${fieldLabels[entry.field] ?? entry.field}）`
                    : ""}
                  {(() => {
                    const format = (v: string) =>
                      entry.field === "health"
                        ? (taskHealthLabels[v] ?? v)
                        : entry.field === "priority"
                          ? (projectPriorityLabels[v] ?? v)
                          : v
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
