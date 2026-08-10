"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  optionColorBgClass,
  optionColorTextOnFillClass,
  optionColorDotClass,
} from "@/lib/option-colors"

type Category = { id: string; name: string; color: string }

export function CategoryTabs({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("category")

  function handleSelect(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!id) params.delete("category")
    else params.set("category", id)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handleSelect(null)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          !current
            ? "bg-foreground text-background"
            : "border bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        全部
      </button>
      {categories.map((category) => {
        const active = current === category.id
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSelect(category.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? `${optionColorBgClass[category.color] ?? optionColorBgClass.gray} ${
                    optionColorTextOnFillClass[category.color] ?? optionColorTextOnFillClass.gray
                  }`
                : "border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {!active && (
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  optionColorDotClass[category.color] ?? optionColorDotClass.gray
                }`}
              />
            )}
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
