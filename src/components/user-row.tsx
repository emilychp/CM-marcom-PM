"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  updateUserGlobalRole,
  updateUserStaffTier,
  deleteUser,
} from "@/app/admin/users/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ResetPasswordDialog } from "@/components/reset-password-dialog"
import { Trash2 } from "lucide-react"
import type { GlobalRole, StaffTier } from "@/generated/prisma/enums"

const globalRoleLabels: Record<string, string> = {
  ADMIN: "系統管理員",
  MEMBER: "一般成員",
}

const staffTierLabels: Record<string, string> = {
  EXECUTION: "專案執行",
  MANAGEMENT: "管理層",
}

const DELETE_ERROR_MESSAGES: Record<string, string> = {
  CANNOT_DELETE_SELF: "無法刪除自己的帳號",
  HAS_RELATED_RECORDS: "這個成員已經有專案或任務紀錄，無法直接刪除",
}

type User = {
  id: string
  name: string
  email: string
  globalRole: string
  staffTier: string
  createdAt: Date
}

export function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [role, setRole] = useState(user.globalRole)
  const [tier, setTier] = useState(user.staffTier)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(value: string | null) {
    if (!value) return
    const previous = role
    setRole(value)
    startTransition(async () => {
      try {
        await updateUserGlobalRole(user.id, value as GlobalRole)
        toast.success("權限已更新")
      } catch {
        toast.error("更新失敗")
        setRole(previous)
      }
    })
  }

  function handleTierChange(value: string | null) {
    if (!value) return
    const previous = tier
    setTier(value)
    startTransition(async () => {
      try {
        await updateUserStaffTier(user.id, value as StaffTier)
        toast.success("身份已更新")
      } catch {
        toast.error("更新失敗")
        setTier(previous)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteUser(user.id)
        toast.success("成員已刪除")
      } catch (err) {
        const message = err instanceof Error ? DELETE_ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "刪除失敗")
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user.name}
            {isSelf && <span className="ml-1 text-xs text-muted-foreground">（你）</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select value={tier} onValueChange={handleTierChange} disabled={isPending}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue>
              {(value: string | null) => (value ? staffTierLabels[value] : "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(staffTierLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={handleRoleChange} disabled={isPending || isSelf}>
          <SelectTrigger size="sm" className="w-32">
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
        <ResetPasswordDialog userId={user.id} userName={user.name} />
        {!isSelf && (
          <ConfirmDeleteDialog
            trigger={
              <button
                type="button"
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            }
            title="刪除成員"
            description={`確定要刪除「${user.name}」的帳號嗎？此操作無法復原。`}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
