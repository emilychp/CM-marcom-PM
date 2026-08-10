"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { changeOwnPassword } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const ERROR_MESSAGES: Record<string, string> = {
  PASSWORD_TOO_SHORT: "新密碼至少需要 8 碼",
  CURRENT_PASSWORD_INCORRECT: "目前密碼不正確",
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  function reset() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      toast.error("兩次輸入的新密碼不一致")
      return
    }
    startTransition(async () => {
      try {
        await changeOwnPassword(currentPassword, newPassword)
        toast.success("密碼已更新")
        reset()
        onOpenChange(false)
      } catch (err) {
        const message = err instanceof Error ? ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "更新失敗")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改密碼</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>目前密碼</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>新密碼</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">至少 8 碼</p>
          </div>
          <div className="space-y-1.5">
            <Label>確認新密碼</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "更新中..." : "更新密碼"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
