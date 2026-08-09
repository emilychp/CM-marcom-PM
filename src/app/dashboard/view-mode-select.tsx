"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const viewModeLabels: Record<string, string> = {
  ALL: "全部",
  OWNER: "依負責人",
  PRIORITY: "依優先性",
  STATUS: "依進行狀態",
}

export function ViewModeSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("view") ?? "ALL"

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "ALL") {
      params.delete("view")
    } else {
      params.set("view", value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-36 bg-card">
        <SelectValue placeholder="檢視模式">
          {(value: string | null) => viewModeLabels[value ?? "ALL"]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(viewModeLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
