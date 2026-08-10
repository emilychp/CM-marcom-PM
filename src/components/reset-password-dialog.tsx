"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { resetUserPassword } from "@/app/admin/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { KeyRound } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  PASSWORD_TOO_SHORT: "密碼至少需要 8 碼",
}

export function ResetPasswordDialog({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    startTransition(async () => {
      try {
        await resetUserPassword(userId, password)
        toast.success("密碼已重設，請另外告知成員新密碼")
        setPassword("")
        setOpen(false)
      } catch (err) {
        const message = err instanceof Error ? ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "重設失敗")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            title="重設密碼"
            className="text-muted-foreground hover:text-foreground"
          >
            <KeyRound className="h-4 w-4" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重設「{userName}」的密碼</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>新密碼</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              至少 8 碼，設定後請另外告知成員本人新密碼
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "重設中..." : "重設密碼"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
