"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  previewMarcomCalendarImport,
  applyMarcomCalendarImport,
} from "@/app/admin/import-marcom-calendar/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { projectStatusLabels, projectPriorityLabels } from "@/lib/status-labels"

type PreviewRow = Awaited<ReturnType<typeof previewMarcomCalendarImport>>[number]

export function ImportTool({
  users,
  defaultOwnerId,
}: {
  users: { id: string; name: string; email: string }[]
  defaultOwnerId: string
}) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ownerId, setOwnerId] = useState(defaultOwnerId)
  const [createdCount, setCreatedCount] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreview() {
    setCreatedCount(null)
    startTransition(async () => {
      try {
        const rows = await previewMarcomCalendarImport()
        setPreview(rows)
        setSelected(new Set(rows.filter((r) => !r.alreadyExists).map((r) => r.name)))
      } catch {
        toast.error("預覽失敗")
      }
    })
  }

  function toggleRow(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function handleApply() {
    startTransition(async () => {
      try {
        const result = await applyMarcomCalendarImport(Array.from(selected), ownerId)
        setCreatedCount(result.createdCount)
        toast.success(`已建立 ${result.createdCount} 個專案`)
      } catch {
        toast.error("匯入失敗")
      }
    })
  }

  return (
    <div className="space-y-4">
      {preview === null ? (
        <Button onClick={handlePreview} disabled={isPending}>
          {isPending ? "檢查中..." : "檢查匯入內容"}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-4">
            <label className="text-sm font-medium">預設負責人</label>
            <Select value={ownerId} onValueChange={(v) => v && setOwnerId(v)}>
              <SelectTrigger size="sm" className="w-56">
                <SelectValue>
                  {() => users.find((u) => u.id === ownerId)?.name ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}（{u.email}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Notion 裡這些項目都還沒有指派負責人，匯入時會統一先掛在這個人名下，之後可以再個別調整。
            </p>
          </div>

          <div className="space-y-2">
            {preview.map((row) => (
              <div
                key={row.name}
                className={`space-y-1.5 rounded-md border p-3 ${
                  row.alreadyExists ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.name)}
                    onChange={() => toggleRow(row.name)}
                    disabled={isPending}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{row.name}</span>
                  <Badge variant="secondary">{projectStatusLabels[row.status]}</Badge>
                  <Badge variant="secondary">{projectPriorityLabels[row.priority]}</Badge>
                  {row.alreadyExists && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
                      已有同名專案，建議取消勾選
                    </Badge>
                  )}
                </div>
                <p className="pl-6 text-xs text-muted-foreground">
                  {row.startDate ?? "無開始日期"} → {row.dueDate ?? "無結束日期"}
                  {row.customFields.length > 0 && (
                    <>
                      {" ・ "}
                      {row.customFields.map((f) => `${f.label}：${f.value}`).join("　")}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>

          {createdCount === null ? (
            <Button onClick={handleApply} disabled={isPending || selected.size === 0}>
              {isPending ? "匯入中..." : `套用匯入這 ${selected.size} 個專案`}
            </Button>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              已建立 {createdCount} 個專案，可以到「專案總覽」查看並補上分類標籤。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
