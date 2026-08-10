"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { setProjectCategories } from "@/app/projects/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { optionColorBgClass, optionColorTextOnFillClass } from "@/lib/option-colors"

type Category = { id: string; name: string; color: string }

export function ProjectCategoryEditor({
  projectId,
  allCategories,
  selectedCategories,
  manageable,
}: {
  projectId: string
  allCategories: Category[]
  selectedCategories: Category[]
  manageable: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(selectedCategories.map((c) => c.id))
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await setProjectCategories(projectId, draft)
        toast.success("分類已更新")
        setOpen(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedCategories.map((category) => (
        <span
          key={category.id}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            optionColorBgClass[category.color] ?? optionColorBgClass.gray
          } ${optionColorTextOnFillClass[category.color] ?? optionColorTextOnFillClass.gray}`}
        >
          {category.name}
        </span>
      ))}
      {selectedCategories.length === 0 && !manageable && (
        <span className="text-sm text-muted-foreground">尚未設定分類</span>
      )}
      {manageable && (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (next) setDraft(selectedCategories.map((c) => c.id))
          }}
        >
          <DialogTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                {selectedCategories.length === 0 ? "設定分類" : "編輯分類"}
              </button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>設定分類</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 py-2">
              {allCategories.map((category) => {
                const selected = draft.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggle(category.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? `${optionColorBgClass[category.color] ?? optionColorBgClass.gray} ${
                            optionColorTextOnFillClass[category.color] ??
                            optionColorTextOnFillClass.gray
                          }`
                        : "border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "儲存中..." : "儲存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
