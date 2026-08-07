export const OPTION_COLOR_PALETTE = [
  "gray",
  "blue",
  "green",
  "yellow",
  "red",
  "purple",
] as const

export type OptionColor = (typeof OPTION_COLOR_PALETTE)[number]

export const optionColorDotClass: Record<string, string> = {
  gray: "bg-muted-foreground/40",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
}

export type FieldOption = { label: string; color?: string }

export function parseFieldOptions(options: unknown): FieldOption[] {
  if (!Array.isArray(options)) return []
  return options
    .map((entry) => {
      if (typeof entry === "string") return { label: entry }
      if (
        entry &&
        typeof entry === "object" &&
        "label" in entry &&
        typeof (entry as { label: unknown }).label === "string"
      ) {
        const color = (entry as { color?: unknown }).color
        return {
          label: (entry as { label: string }).label,
          color: typeof color === "string" ? color : undefined,
        }
      }
      return null
    })
    .filter((entry): entry is FieldOption => entry !== null)
}
