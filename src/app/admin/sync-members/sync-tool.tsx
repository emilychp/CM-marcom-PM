"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  previewMissingMemberships,
  applyMissingMemberships,
} from "@/app/admin/sync-members/actions"
import { Button } from "@/components/ui/button"

type Missing = { projectId: string; projectName: string; userId: string; userName: string }

export function SyncTool() {
  const [missing, setMissing] = useState<Missing[] | null>(null)
  const [applied, setApplied] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreview() {
    setApplied(null)
    startTransition(async () => {
      try {
        const result = await previewMissingMemberships()
        setMissing(result)
      } catch {
        toast.error("預覽失敗")
      }
    })
  }

  function handleApply() {
    startTransition(async () => {
      try {
        const result = await applyMissingMemberships()
        setApplied(result.appliedCount)
        toast.success(`已補上 ${result.appliedCount} 筆成員資格`)
      } catch {
        toast.error("套用失敗")
      }
    })
  }

  return (
    <div className="space-y-4">
      {missing === null ? (
        <Button onClick={handlePreview} disabled={isPending}>
          {isPending ? "檢查中..." : "檢查目前狀況"}
        </Button>
      ) : (
        <div className="space-y-3 rounded-md border bg-muted/30 p-4">
          <p className="text-sm">
            發現 <span className="font-semibold">{missing.length}</span>{" "}
            筆「有任務指派、但不是專案成員」的資料
          </p>
          {missing.length > 0 && (
            <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {missing.map((m, i) => (
                <li key={i}>
                  {m.userName} → {m.projectName}
                </li>
              ))}
            </ul>
          )}
          {applied === null ? (
            <Button onClick={handleApply} disabled={isPending || missing.length === 0} size="sm">
              {isPending ? "套用中..." : `補上這 ${missing.length} 筆成員資格`}
            </Button>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              已補上 {applied} 筆，這些人現在可以看到專案內容了
            </p>
          )}
        </div>
      )}
    </div>
  )
}
