"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createUser } from "@/app/admin/users/actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { GlobalRole } from "@/generated/prisma/enums"

const ERROR_MESSAGES: Record<string, string> = {
  PASSWORD_TOO_SHORT: "密碼至少需要 8 碼",
  EMAIL_TAKEN: "這個 email 已經被使用了",
}

const globalRoleLabels: Record<string, string> = {
  ADMIN: "系統管理員",
  MEMBER: "一般成員",
}

export function NewUserDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [globalRole, setGlobalRole] = useState<GlobalRole>("MEMBER")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    startTransition(async () => {
      try {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password,
          globalRole,
        })
        toast.success("成員帳號已建立")
        setName("")
        setEmail("")
        setPassword("")
        setGlobalRole("MEMBER")
        setOpen(false)
      } catch (err) {
        const message = err instanceof Error ? ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "建立失敗")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            新增成員
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增團隊成員</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>姓名</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>初始密碼</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              至少 8 碼，建立後請另外告知成員本人，之後可請他們自行登入使用
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>系統權限</Label>
            <Select value={globalRole} onValueChange={(v) => v && setGlobalRole(v as GlobalRole)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) => (value ? globalRoleLabels[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(globalRoleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              系統管理員可以看到所有專案；一般成員只能看到自己被加入的專案
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "建立中..." : "建立帳號"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
