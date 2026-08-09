"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectStatusLabels } from "@/lib/status-labels"

export function StatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("status") ?? "ALL"

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "ALL") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-40 bg-card">
        <SelectValue placeholder="篩選狀態">
          {(value: string | null) =>
            !value || value === "ALL" ? "全部狀態" : projectStatusLabels[value]
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">全部狀態</SelectItem>
        {Object.entries(projectStatusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
