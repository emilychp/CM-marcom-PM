"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { toast } from "sonner"
import { ProjectCard, type ProjectCardData } from "@/components/project-card"
import { reorderProjects } from "@/app/projects/actions"

function useColumnCount() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      setCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return count
}

function splitIntoColumns(projects: ProjectCardData[], columnCount: number) {
  const columns: ProjectCardData[][] = Array.from({ length: columnCount }, () => [])
  projects.forEach((project, index) => {
    columns[index % columnCount].push(project)
  })
  return columns
}

function SortableCard({ project }: { project: ProjectCardData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="拖曳排序"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <ProjectCard project={project} />
    </div>
  )
}

export function ProjectBoard({
  projects,
  sortable,
}: {
  projects: ProjectCardData[]
  sortable: boolean
}) {
  const columnCount = useColumnCount()
  const [order, setOrder] = useState(() => projects.map((p) => p.id))
  const [prevProjects, setPrevProjects] = useState(projects)
  // dnd-kit generates SSR-unstable internal ids, so its interactive tree
  // only mounts client-side; SSR/hydration always render the static grid.
  const [mounted, setMounted] = useState(false)

  if (projects !== prevProjects) {
    setPrevProjects(projects)
    setOrder(projects.map((p) => p.id))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detecting client mount for SSR-unsafe dnd-kit tree
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const byId = new Map(projects.map((p) => [p.id, p]))
  const orderedProjects = order.map((id) => byId.get(id)).filter((p): p is ProjectCardData => !!p)
  const columns = splitIntoColumns(orderedProjects, columnCount)
  const interactive = sortable && mounted

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id))
      const newIndex = prev.indexOf(String(over.id))
      const next = arrayMove(prev, oldIndex, newIndex)
      reorderProjects(next).catch(() => toast.error("排序儲存失敗，請重新整理再試一次"))
      return next
    })
  }

  const grid = (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
      {columns.map((column, i) => (
        <div key={i} className="space-y-4">
          {column.map((project) =>
            interactive ? (
              <SortableCard key={project.id} project={project} />
            ) : (
              <ProjectCard key={project.id} project={project} />
            )
          )}
        </div>
      ))}
    </div>
  )

  if (!interactive) return grid

  return (
    <DndContext
      id="project-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order}>{grid}</SortableContext>
    </DndContext>
  )
}
