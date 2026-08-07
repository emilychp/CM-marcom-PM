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
