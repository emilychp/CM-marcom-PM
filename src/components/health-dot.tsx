import { taskHealthDotColor, taskHealthLabels } from "@/lib/status-labels"

export function HealthDot({
  health,
  size = "sm",
}: {
  health: string
  size?: "sm" | "lg"
}) {
  return (
    <span
      title={taskHealthLabels[health] ?? health}
      className={`inline-block shrink-0 rounded-full ${taskHealthDotColor[health] ?? "bg-muted-foreground/30"} ${
        size === "lg" ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
      }`}
    />
  )
}
