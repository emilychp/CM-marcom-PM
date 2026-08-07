const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-emerald-500",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-500",
  TODO: "bg-muted-foreground/30",
}

const STATUS_LABELS: Record<string, string> = {
  DONE: "完成",
  IN_PROGRESS: "進行中",
  BLOCKED: "卡關",
  TODO: "待辦",
}

const STATUS_ORDER = ["DONE", "IN_PROGRESS", "BLOCKED", "TODO"] as const

type StatusCounts = Record<string, number>

export function TaskStatusBreakdown({ counts }: { counts: StatusCounts }) {
  const total = STATUS_ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0)

  if (total === 0) {
    return <p className="text-xs text-muted-foreground">尚無任務</p>
  }

  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {STATUS_ORDER.map((key) => {
          const count = counts[key] ?? 0
          if (count === 0) return null
          return (
            <div
              key={key}
              className={STATUS_COLORS[key]}
              style={{ width: `${(count / total) * 100}%` }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
        {STATUS_ORDER.map((key) => {
          const count = counts[key] ?? 0
          if (count === 0) return null
          return (
            <span key={key} className="inline-flex items-center gap-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_COLORS[key]}`} />
              {STATUS_LABELS[key]} {count}
            </span>
          )
        })}
      </div>
    </div>
  )
}
