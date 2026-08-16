"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  UserCog,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"

type NavItem = { href: string; label: string; desc: string; icon: LucideIcon }

const WORKSPACE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "專案儀表板", desc: "所有專案總覽，含篩選與分類", icon: LayoutDashboard },
  { href: "/my-projects", label: "我的專案", desc: "我擁有、負責的專案", icon: FolderKanban },
  { href: "/my-tasks", label: "我的任務", desc: "指派給我、待處理的任務", icon: ListChecks },
]

const ADMIN_ITEMS: NavItem[] = [
  { href: "/workload", label: "人力分配", desc: "依工作模組檢視佔比", icon: Users },
  { href: "/admin/users", label: "成員管理", desc: "帳號、權限與身份分級", icon: UserCog },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function MegaMenuItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <DropdownMenuItem
      render={
        <Link
          href={item.href}
          className={`flex items-start gap-2.5 rounded-md px-2 py-2 ${active ? "bg-accent/60" : ""}`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
              active
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{item.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
          </span>
        </Link>
      }
    />
  )
}

export function MegaMenu({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const allItems = [...WORKSPACE_ITEMS, ...(isAdmin ? ADMIN_ITEMS : [])]
  const current = allItems.find((item) => isActive(pathname, item.href)) ?? WORKSPACE_ITEMS[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-lg font-semibold tracking-tight hover:bg-accent"
          >
            <CurrentIcon className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">{current.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent
        align="start"
        className="grid w-[min(92vw,520px)] grid-cols-1 gap-3 p-2 sm:grid-cols-2"
      >
        <div className="space-y-0.5">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">工作區</p>
          {WORKSPACE_ITEMS.map((item) => (
            <MegaMenuItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>
        {isAdmin && (
          <div className="space-y-0.5 sm:border-l sm:pl-3">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              管理・僅系統管理員
            </p>
            {ADMIN_ITEMS.map((item) => (
              <MegaMenuItem key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
