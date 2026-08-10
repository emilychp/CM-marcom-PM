"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createProject } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { optionColorBgClass, optionColorTextOnFillClass } from "@/lib/option-colors"

const schema = z.object({
  name: z.string().min(1, "請輸入專案名稱"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

type Category = { id: string; name: string; color: string }

export function NewProjectDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", dueDate: "" },
  })

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const project = await createProject({ ...values, categoryIds })
      toast.success("專案已建立")
      setOpen(false)
      form.reset()
      setCategoryIds([])
      router.push(`/projects/${project.id}`)
    } catch {
      toast.error("建立專案失敗，請稍後再試")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            新增專案
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增專案</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>專案名稱</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：官網改版專案" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>專案描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="簡述專案目標與範圍" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>截止日期</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">分類</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = categoryIds.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? `${optionColorBgClass[category.color] ?? optionColorBgClass.gray} ${
                                optionColorTextOnFillClass[category.color] ??
                                optionColorTextOnFillClass.gray
                              }`
                            : "border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "建立中..." : "建立專案"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
