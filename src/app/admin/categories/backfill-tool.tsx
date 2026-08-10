"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  previewCategoryBackfill,
  applyCategoryBackfill,
} from "@/app/admin/categories/actions"
import { Button } from "@/components/ui/button"

type FieldDef = {
  id: string
  label: string
  key: string
  fieldType: string
  valueCount: number
  distinctValues: string[]
}

type Preview = {
  matchedCount: number
  unmatchedValues: string[]
  preview: { projectId: string; oldValue: string; categoryName: string }[]
}

export function BackfillTool({ fieldDefs }: { fieldDefs: FieldDef[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [applied, setApplied] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreview(id: string) {
    setSelectedId(id)
    setPreview(null)
    setApplied(null)
    startTransition(async () => {
      try {
        const result = await previewCategoryBackfill(id)
        setPreview(result)
      } catch {
        toast.error("預覽失敗")
      }
    })
  }

  function handleApply() {
    if (!selectedId) return
    startTransition(async () => {
      try {
        const result = await applyCategoryBackfill(selectedId)
        setApplied(result.appliedCount)
        toast.success(`已套用 ${result.appliedCount} 筆分類`)
      } catch {
        toast.error("套用失敗")
      }
    })
  }

  if (fieldDefs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        目前沒有任何專案層級的自訂欄位，找不到可對應的舊分類資料。
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {fieldDefs.map((fd) => (
          <button
            key={fd.id}
            type="button"
            onClick={() => handlePreview(fd.id)}
            className={`block w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
              selectedId === fd.id ? "border-foreground bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <p className="text-sm font-medium">
              {fd.label}{" "}
              <span className="font-normal text-muted-foreground">
                ({fd.fieldType}・{fd.valueCount} 筆資料)
              </span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              範例值：{fd.distinctValues.join("、") || "（無）"}
            </p>
          </button>
        ))}
      </div>

      {isPending && !preview && <p className="text-sm text-muted-foreground">預覽中...</p>}

      {preview && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-4">
          <p className="text-sm">
            可對應 <span className="font-semibold">{preview.matchedCount}</span> 筆專案分類資料
          </p>
          {preview.preview.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {preview.preview.map((p, i) => (
                <li key={i}>
                  專案 {p.projectId}：「{p.oldValue}」→「{p.categoryName}」
                </li>
              ))}
              {preview.matchedCount > preview.preview.length && (
                <li>...等共 {preview.matchedCount} 筆</li>
              )}
            </ul>
          )}
          {preview.unmatchedValues.length > 0 && (
            <p className="text-xs text-amber-600">
              以下數值無法對應到任何分類，需要手動處理：
              {preview.unmatchedValues.join("、")}
            </p>
          )}
          {applied === null ? (
            <Button
              onClick={handleApply}
              disabled={isPending || preview.matchedCount === 0}
              size="sm"
            >
              {isPending ? "套用中..." : `套用這 ${preview.matchedCount} 筆對應`}
            </Button>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              已套用 {applied} 筆，可以到專案總覽確認分類標籤了
            </p>
          )}
        </div>
      )}
    </div>
  )
}
