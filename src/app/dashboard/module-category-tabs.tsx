"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  optionColorBgClass,
  optionColorTextOnFillClass,
  optionColorDotClass,
} from "@/lib/option-colors"

type Category = { id: string; name: string; color: string }
type Module = { id: string; name: string; color: string; categories: Category[] }

export function ModuleCategoryTabs({ modules }: { modules: Module[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentModule = searchParams.get("module")
  const currentCategory = searchParams.get("category")

  function selectModule(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!id) params.delete("module")
    else params.set("module", id)
    params.delete("category")
    router.push(`${pathname}?${params.toString()}`)
  }

  function selectCategory(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!id) params.delete("category")
    else params.set("category", id)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (modules.length === 0) return null

  const activeModule = modules.find((m) => m.id === currentModule) ?? null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectModule(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            !currentModule
              ? "bg-foreground text-background"
              : "border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          全部
        </button>
        {modules.map((mod) => {
          const active = currentModule === mod.id
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => selectModule(mod.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? `${optionColorBgClass[mod.color] ?? optionColorBgClass.gray} ${
                      optionColorTextOnFillClass[mod.color] ?? optionColorTextOnFillClass.gray
                    }`
                  : "border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {!active && (
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    optionColorDotClass[mod.color] ?? optionColorDotClass.gray
                  }`}
                />
              )}
              {mod.name}
            </button>
          )
        })}
      </div>

      {activeModule && (
        <div className="flex flex-wrap items-center gap-1.5 border-l-2 pl-3">
          {activeModule.categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">此模組尚未指定分類標籤</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  !currentCategory
                    ? "bg-muted text-foreground"
                    : "border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                全部類別
              </button>
              {activeModule.categories.map((category) => {
                const active = currentCategory === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border border-foreground/30 bg-muted font-semibold text-foreground"
                        : "border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        optionColorDotClass[category.color] ?? optionColorDotClass.gray
                      }`}
                    />
                    {category.name}
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
