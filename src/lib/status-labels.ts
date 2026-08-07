export const projectStatusLabels: Record<string, string> = {
  PLANNING: "規劃中",
  IN_PROGRESS: "進行中",
  ON_HOLD: "暫停",
  COMPLETED: "已完成",
  ARCHIVED: "已封存",
}

export const projectStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PLANNING: "outline",
  IN_PROGRESS: "default",
  ON_HOLD: "destructive",
  COMPLETED: "secondary",
  ARCHIVED: "outline",
}

export const phaseStatusLabels: Record<string, string> = {
  NOT_STARTED: "尚未開始",
  IN_PROGRESS: "進行中",
  DONE: "已完成",
}

export const taskStatusLabels: Record<string, string> = {
  TODO: "待辦",
  IN_PROGRESS: "進行中",
  BLOCKED: "卡關",
  DONE: "完成",
}

export const taskStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  TODO: "outline",
  IN_PROGRESS: "default",
  BLOCKED: "destructive",
  DONE: "secondary",
}

export const taskHealthLabels: Record<string, string> = {
  ON_TRACK: "正常",
  AT_RISK: "注意",
  DELAYED: "延遲",
}

export const taskHealthDotColor: Record<string, string> = {
  ON_TRACK: "bg-emerald-500",
  AT_RISK: "bg-amber-400",
  DELAYED: "bg-red-500",
}

// Ordered from most to least severe, used to roll many tasks' health
// up into a single overall project indicator.
export const TASK_HEALTH_SEVERITY = ["DELAYED", "AT_RISK", "ON_TRACK"] as const

export const projectPriorityLabels: Record<string, string> = {
  URGENT: "緊急",
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
}

export const projectPriorityBadgeClass: Record<string, string> = {
  URGENT: "bg-red-600 text-white hover:bg-red-600/90",
  HIGH: "bg-orange-500 text-white hover:bg-orange-500/90",
  MEDIUM: "bg-amber-400 text-black hover:bg-amber-400/90",
  LOW: "bg-muted text-muted-foreground hover:bg-muted/90",
}

// Ordered from highest to lowest, used both for the dashboard's default
// sort and to rank a numeric weight for comparisons.
export const PROJECT_PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const

export const recurrenceFrequencyLabels: Record<string, string> = {
  WEEKLY: "每週",
  MONTHLY: "每月",
  QUARTERLY: "每季",
  YEARLY: "每年",
}
