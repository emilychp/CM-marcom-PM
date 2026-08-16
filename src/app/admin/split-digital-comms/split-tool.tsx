"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  previewDigitalCommsSplit,
  applyDigitalCommsSplit,
} from "@/app/admin/split-digital-comms/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PreviewRow = Awaited<ReturnType<typeof previewDigitalCommsSplit>>[number]

export function SplitTool() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [appliedCount, setAppliedCount] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreview() {
    setAppliedCount(null)
    startTransition(async () => {
      try {
        const rows = await previewDigitalCommsSplit()
        setPreview(rows)
        setSelected(
          new Set(rows.filter((r) => r.suggested && !r.alreadyTagged).map((r) => r.id))
        )
      } catch {
        toast.error("預覽失敗")
      }
    })
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleApply() {
    startTransition(async () => {
      try {
        const result = await applyDigitalCommsSplit(Array.from(selected))
        setAppliedCount(result.appliedCount)
        toast.success(`已加上 ${result.appliedCount} 筆數位傳播分類`)
      } catch {
        toast.error("套用失敗")
      }
    })
  }

  return (
    <div className="space-y-4">
      {preview === null ? (
        <Button onClick={handlePreview} disabled={isPending}>
          {isPending ? "檢查中..." : "檢查目前溝通管理底下的專案"}
        </Button>
      ) : preview.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          目前沒有專案掛在「溝通管理」分類下，沒有需要調整的項目。
        </p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {preview.map((row) => (
              <label
                key={row.id}
                className={`flex items-center gap-2.5 rounded-md border p-2.5 text-sm ${
                  row.alreadyTagged ? "bg-muted/30 text-muted-foreground" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(row.id) || row.alreadyTagged}
                  disabled={row.alreadyTagged || isPending}
                  onChange={() => toggleRow(row.id)}
                  className="h-4 w-4"
                />
                <span className="flex-1">{row.name}</span>
                {row.alreadyTagged && <Badge variant="secondary">已有數位傳播標籤</Badge>}
                {!row.alreadyTagged && row.suggested && (
                  <Badge className="bg-blue-500 text-white hover:bg-blue-500/90">
                    建議加入
                  </Badge>
                )}
              </label>
            ))}
          </div>

          {appliedCount === null ? (
            <Button onClick={handleApply} disabled={isPending || selected.size === 0}>
              {isPending ? "套用中..." : `套用這 ${selected.size} 筆`}
            </Button>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              已加上 {appliedCount} 筆數位傳播分類，可以到專案儀表板確認結果。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
