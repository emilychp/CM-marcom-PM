"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { KeyRound } from "lucide-react"

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{name.slice(0, 1) ?? "U"}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
            </button>
          }
        />
        <DropdownMenuContent align="end">
          <div className="px-1.5 py-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
            <KeyRound className="h-4 w-4" />
            修改密碼
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </>
  )
}
