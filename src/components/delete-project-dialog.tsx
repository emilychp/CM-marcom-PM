"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteProject } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

export function DeleteProjectDialog({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isPending, startTransition] = useTransition()

  const matches = confirmText.trim() === projectName

  function handleDelete() {
    if (!matches) return
    startTransition(async () => {
      try {
        await deleteProject(projectId)
        toast.success("專案已刪除")
        router.push("/dashboard")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirmText("")
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-1.5 h-4 w-4" />
            刪除此專案
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>刪除專案「{projectName}」</DialogTitle>
          <DialogDescription>
            這會永久刪除這個專案，包括所有階段、任務、附件、自訂欄位與異動紀錄，
            <span className="font-medium text-destructive">無法復原</span>。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>
            請輸入專案名稱「<span className="font-medium">{projectName}</span>」以確認
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isPending}
            autoFocus
            placeholder={projectName}
          />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!matches || isPending}
            onClick={handleDelete}
          >
            {isPending ? "刪除中..." : "永久刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
