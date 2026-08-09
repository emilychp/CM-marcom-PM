"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, ListChecks, Users, UserCog } from "lucide-react"

const links = [
  { href: "/my-projects", label: "我的專案", icon: FolderKanban, adminOnly: false },
  { href: "/my-tasks", label: "我的任務", icon: ListChecks, adminOnly: false },
  { href: "/workload", label: "人力分配", icon: Users, adminOnly: true },
  { href: "/admin/users", label: "成員管理", icon: UserCog, adminOnly: true },
]

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {links
        .filter((link) => !link.adminOnly || isAdmin)
        .map((link) => {
          const Icon = link.icon
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          )
        })}
    </nav>
  )
}
