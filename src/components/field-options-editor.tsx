"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  OPTION_COLOR_PALETTE,
  optionColorDotClass,
  type FieldOption,
} from "@/lib/option-colors"

export function FieldOptionsEditor({
  options,
  onChange,
  showColor,
}: {
  options: FieldOption[]
  onChange: (options: FieldOption[]) => void
  showColor: boolean
}) {
  const [draft, setDraft] = useState("")

  function addOption() {
    const label = draft.trim()
    if (!label || options.some((o) => o.label === label)) {
      setDraft("")
      return
    }
    onChange([
      ...options,
      { label, color: showColor ? OPTION_COLOR_PALETTE[options.length % OPTION_COLOR_PALETTE.length] : undefined },
    ])
    setDraft("")
  }

  function removeOption(label: string) {
    onChange(options.filter((o) => o.label !== label))
  }

  function cycleColor(label: string) {
    onChange(
      options.map((o) => {
        if (o.label !== label) return o
        const idx = OPTION_COLOR_PALETTE.indexOf((o.color as (typeof OPTION_COLOR_PALETTE)[number]) ?? OPTION_COLOR_PALETTE[0])
        const next = OPTION_COLOR_PALETTE[(idx + 1) % OPTION_COLOR_PALETTE.length]
        return { ...o, color: next }
      })
    )
  }

  return (
    <div className="w-full space-y-2 rounded-md border border-dashed p-2">
      <p className="text-xs text-muted-foreground">
        設定選項{showColor ? "（點色點可切換顏色）" : ""}
      </p>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <span
              key={option.label}
              className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-0.5 pr-1.5 pl-2 text-xs"
            >
              {showColor && (
                <button
                  type="button"
                  onClick={() => cycleColor(option.label)}
                  className={`h-2.5 w-2.5 rounded-full ${optionColorDotClass[option.color ?? "gray"]}`}
                />
              )}
              {option.label}
              <button
                type="button"
                onClick={() => removeOption(option.label)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addOption()
            }
          }}
          placeholder="輸入選項名稱後按 Enter"
          className="h-7 flex-1 text-xs"
        />
      </div>
    </div>
  )
}
