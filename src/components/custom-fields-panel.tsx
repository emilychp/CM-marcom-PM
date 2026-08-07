"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  setFieldValue,
  upsertFieldDefinition,
  updateFieldDefinition,
  deleteFieldDefinition,
} from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { FieldOptionsEditor } from "@/components/field-options-editor"
import { Plus, Pencil, Trash2, Check, X as XIcon } from "lucide-react"
import { parseFieldOptions, optionColorDotClass, type FieldOption } from "@/lib/option-colors"
import type { FieldType } from "@/generated/prisma/enums"

type FieldDefinition = {
  id: string
  key: string
  label: string
  fieldType: string
  options: unknown
  values: { value: unknown }[]
}

const fieldTypeLabels: Record<string, string> = {
  TEXT: "文字",
  NUMBER: "數字",
  DATE: "日期",
  SELECT: "下拉選單",
  STATUS: "狀態",
}

const OPTION_BASED_TYPES = new Set(["SELECT", "STATUS"])

export function CustomFieldsPanel({
  projectId,
  entityType,
  entityId,
  fieldDefs,
  manageable,
}: {
  projectId: string
  entityType: "PROJECT" | "TASK"
  entityId: string
  fieldDefs: FieldDefinition[]
  manageable: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>自訂欄位</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fieldDefs.length === 0 && (
          <p className="text-sm text-muted-foreground">尚未設定自訂欄位</p>
        )}
        {fieldDefs.map((fieldDef) => (
          <FieldRow
            key={fieldDef.id}
            projectId={projectId}
            entityType={entityType}
            entityId={entityId}
            fieldDef={fieldDef}
            manageable={manageable}
          />
        ))}
        {manageable && <AddFieldDefinitionForm projectId={projectId} />}
      </CardContent>
    </Card>
  )
}

function FieldRow({
  projectId,
  entityType,
  entityId,
  fieldDef,
  manageable,
}: {
  projectId: string
  entityType: "PROJECT" | "TASK"
  entityId: string
  fieldDef: FieldDefinition
  manageable: boolean
}) {
  const [editingDef, setEditingDef] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDeleteDef() {
    startTransition(async () => {
      try {
        await deleteFieldDefinition(fieldDef.id, projectId)
        toast.success("欄位已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  if (editingDef) {
    return (
      <FieldDefinitionEditor
        projectId={projectId}
        fieldDef={fieldDef}
        onDone={() => setEditingDef(false)}
      />
    )
  }

  return (
    <div className="group flex items-center justify-between gap-3">
      <Label className="w-32 shrink-0 text-sm text-muted-foreground">
        {fieldDef.label}
      </Label>
      <FieldValueEditor
        projectId={projectId}
        entityType={entityType}
        entityId={entityId}
        fieldDef={fieldDef}
      />
      {manageable && (
        <div className="flex shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditingDef(true)}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDeleteDialog
            trigger={
              <button
                type="button"
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="刪除自訂欄位"
            description={`確定要刪除欄位「${fieldDef.label}」嗎？已填寫的內容也會一併刪除，此操作無法復原。`}
            onConfirm={handleDeleteDef}
          />
        </div>
      )}
    </div>
  )
}

function FieldValueEditor({
  projectId,
  entityType,
  entityId,
  fieldDef,
}: {
  projectId: string
  entityType: "PROJECT" | "TASK"
  entityId: string
  fieldDef: FieldDefinition
}) {
  const initial = fieldDef.values[0]?.value
  const [value, setValue] = useState(initial != null ? String(initial) : "")
  const [isPending, startTransition] = useTransition()

  function commit(next: string) {
    startTransition(async () => {
      try {
        const parsed = fieldDef.fieldType === "NUMBER" ? Number(next) : next
        await setFieldValue(entityType, entityId, projectId, fieldDef.id, parsed)
      } catch {
        toast.error("更新欄位失敗")
      }
    })
  }

  if (OPTION_BASED_TYPES.has(fieldDef.fieldType)) {
    const options = parseFieldOptions(fieldDef.options)
    const showColor = fieldDef.fieldType === "STATUS"
    const selected = options.find((o) => o.label === value)

    if (options.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          尚未設定選項，請主管編輯此欄位新增選項
        </p>
      )
    }

    return (
      <Select
        value={value}
        onValueChange={(v) => {
          if (!v) return
          setValue(v)
          commit(v)
        }}
        disabled={isPending}
      >
        <SelectTrigger size="sm" className="h-8 flex-1">
          <SelectValue placeholder="請選擇">
            {() =>
              selected ? (
                <span className="flex items-center gap-1.5">
                  {showColor && (
                    <span
                      className={`h-2 w-2 rounded-full ${optionColorDotClass[selected.color ?? "gray"]}`}
                    />
                  )}
                  {selected.label}
                </span>
              ) : (
                "請選擇"
              )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.label} value={option.label}>
              <span className="flex items-center gap-1.5">
                {showColor && (
                  <span
                    className={`h-2 w-2 rounded-full ${optionColorDotClass[option.color ?? "gray"]}`}
                  />
                )}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      type={fieldDef.fieldType === "NUMBER" ? "number" : fieldDef.fieldType === "DATE" ? "date" : "text"}
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commit(value)}
      className="h-8"
    />
  )
}

function FieldDefinitionEditor({
  projectId,
  fieldDef,
  onDone,
}: {
  projectId: string
  fieldDef: FieldDefinition
  onDone: () => void
}) {
  const [label, setLabel] = useState(fieldDef.label)
  const [fieldType, setFieldType] = useState<FieldType>(fieldDef.fieldType as FieldType)
  const [options, setOptions] = useState<FieldOption[]>(parseFieldOptions(fieldDef.options))
  const [isPending, startTransition] = useTransition()

  function save() {
    const trimmed = label.trim()
    if (!trimmed) return
    startTransition(async () => {
      try {
        await updateFieldDefinition(fieldDef.id, projectId, {
          label: trimmed,
          fieldType,
          options: OPTION_BASED_TYPES.has(fieldType) ? options : [],
        })
        toast.success("欄位已更新")
        onDone()
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          value={label}
          disabled={isPending}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 w-32"
        />
        <Select value={fieldType} onValueChange={(v) => v && setFieldType(v as FieldType)}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue>
              {(value: string | null) => (value ? fieldTypeLabels[value] : "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(fieldTypeLabels).map(([value, l]) => (
              <SelectItem key={value} value={value}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button type="button" onClick={save} disabled={isPending}>
          <Check className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
        <button type="button" onClick={onDone} disabled={isPending}>
          <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      {OPTION_BASED_TYPES.has(fieldType) && (
        <FieldOptionsEditor
          options={options}
          onChange={setOptions}
          showColor={fieldType === "STATUS"}
        />
      )}
    </div>
  )
}

function AddFieldDefinitionForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [fieldType, setFieldType] = useState<FieldType>("TEXT")
  const [options, setOptions] = useState<FieldOption[]>([])
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const key = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, "_")
    startTransition(async () => {
      try {
        await upsertFieldDefinition(projectId, {
          scope: "PROJECT",
          key,
          label: label.trim(),
          fieldType,
          options: OPTION_BASED_TYPES.has(fieldType) ? options : [],
        })
        toast.success("已新增自訂欄位")
        setLabel("")
        setOptions([])
        setOpen(false)
      } catch {
        toast.error("新增失敗")
      }
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        新增自訂欄位
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="欄位名稱，例如：預算"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 flex-1"
        />
        <Select value={fieldType} onValueChange={(v) => v && setFieldType(v as FieldType)}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue>
              {(value: string | null) => (value ? fieldTypeLabels[value] : "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(fieldTypeLabels).map(([value, l]) => (
              <SelectItem key={value} value={value}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={isPending}>
          新增
        </Button>
      </div>
      {OPTION_BASED_TYPES.has(fieldType) && (
        <FieldOptionsEditor
          options={options}
          onChange={setOptions}
          showColor={fieldType === "STATUS"}
        />
      )}
    </form>
  )
}
