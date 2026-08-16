"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addProjectMember, removeProjectMember } from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

type Member = {
  user: { id: string; name: string; email: string }
  roleInProject: string
  isDeputy: boolean
}

type RoleValue = "MEMBER" | "MANAGER" | "DEPUTY"

const ROLE_LABELS: Record<RoleValue, string> = {
  MEMBER: "成員",
  MANAGER: "管理者",
  DEPUTY: "第二負責人",
}

function roleValueOf(m: Member): RoleValue {
  if (m.roleInProject === "MANAGER") return m.isDeputy ? "DEPUTY" : "MANAGER"
  return "MEMBER"
}

function roleBadgeClass(value: RoleValue): string {
  if (value === "DEPUTY") return "bg-blue-500 text-white hover:bg-blue-500/90"
  if (value === "MANAGER") return "bg-foreground text-background hover:bg-foreground/90"
  return "border bg-card text-muted-foreground"
}

export function MembersPanel({
  projectId,
  members,
  allUsers,
  manageable,
}: {
  projectId: string
  members: Member[]
  allUsers: { id: string; name: string }[]
  manageable: boolean
}) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const memberIds = new Set(members.map((m) => m.user.id))
  const candidates = allUsers.filter((u) => !memberIds.has(u.id))

  function handleAdd() {
    if (!selectedUser) return
    startTransition(async () => {
      try {
        await addProjectMember(projectId, selectedUser, "MEMBER")
        toast.success("已加入成員")
        setSelectedUser(null)
      } catch {
        toast.error("加入失敗")
      }
    })
  }

  function handleRoleChange(userId: string, value: string | null) {
    if (!value) return
    const roleValue = value as RoleValue
    const roleInProject = roleValue === "MEMBER" ? "MEMBER" : "MANAGER"
    const isDeputy = roleValue === "DEPUTY"
    startTransition(async () => {
      try {
        await addProjectMember(projectId, userId, roleInProject, isDeputy)
        toast.success("角色已更新")
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      try {
        await removeProjectMember(projectId, userId)
        toast.success("已移除成員")
      } catch {
        toast.error("移除失敗")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>專案成員</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {members.map((m) => {
            const roleValue = roleValueOf(m)
            return (
              <li
                key={m.user.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {m.user.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {m.user.email}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {manageable ? (
                    <Select
                      value={roleValue}
                      onValueChange={(v) => handleRoleChange(m.user.id, v)}
                    >
                      <SelectTrigger
                        size="sm"
                        className={`h-6 w-auto gap-1 rounded-full border-0 px-2.5 text-xs font-medium ${roleBadgeClass(roleValue)}`}
                      >
                        <SelectValue>
                          {() => ROLE_LABELS[roleValue]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as RoleValue[]).map((v) => (
                          <SelectItem key={v} value={v}>
                            {ROLE_LABELS[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={roleBadgeClass(roleValue)}>
                      {ROLE_LABELS[roleValue]}
                    </Badge>
                  )}
                  {manageable && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.user.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {manageable && candidates.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Select value={selectedUser ?? undefined} onValueChange={setSelectedUser}>
              <SelectTrigger size="sm" className="flex-1">
                <SelectValue placeholder="選擇要加入的成員">
                  {(value: string | null) =>
                    candidates.find((u) => u.id === value)?.name ?? "選擇要加入的成員"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {candidates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={isPending || !selectedUser}>
              加入
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
