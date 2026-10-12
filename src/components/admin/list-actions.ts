"use client"

import { toast } from "sonner"
import { ZodError } from "zod"
import type { SiteContent } from "@/content/schema"
import { newId, useCms } from "@/lib/cms-store"
import { move } from "./fields"

type ListKey = "treatments" | "dentists" | "faqs"
type Item<K extends ListKey> = SiteContent[K][number]

/** Field that must stay unique per list (the booking form refers to items by it). */
const UNIQUE_FIELD: Partial<Record<ListKey, string>> = { treatments: "name", dentists: "shortName" }

/** "Braces" → "Braces (copy)", "Braces (copy 2)", … until unused. */
function uniqueName(base: string, taken: string[], suffix: string) {
  const used = new Set(taken.map((n) => n.trim().toLowerCase()))
  if (!used.has(base.trim().toLowerCase())) return base
  for (let n = 1; ; n++) {
    const candidate = `${base} (${suffix}${n > 1 ? " " + n : ""})`
    if (!used.has(candidate.toLowerCase())) return candidate
  }
}

/** Immediate (auto-saved) list operations for the collection overview pages. */
export function useListActions<K extends ListKey>(key: K) {
  const { content, saveContent } = useCms()
  const list = content[key] as Item<K>[]
  const field = UNIQUE_FIELD[key]
  const names = () => (field ? list.map((i) => String((i as Record<string, unknown>)[field])) : [])

  const commit = async (next: Item<K>[], message: string) => {
    try {
      await saveContent({ ...content, [key]: next })
      toast.success(message)
      return true
    } catch (err) {
      toast.error("Could not save", { description: err instanceof ZodError ? err.issues[0]?.message : undefined })
      return false
    }
  }

  const withUniqueName = <T extends Record<string, unknown>>(item: T, suffix: string): T =>
    field ? { ...item, [field]: uniqueName(String(item[field]), names(), suffix) } : item

  return {
    list,
    move: (from: number, to: number) => commit(move(list, from, to), "Order updated"),
    remove: (id: string) => commit(list.filter((i) => i.id !== id), "Deleted"),
    duplicate: async (id: string) => {
      const i = list.findIndex((x) => x.id === id)
      if (i < 0) return
      const copy = { ...withUniqueName(structuredClone(list[i]), "copy"), id: newId() } as Item<K>
      const next = list.slice()
      next.splice(i + 1, 0, copy)
      return (await commit(next, "Duplicated")) ? copy.id : undefined
    },
    add: async (item: Omit<Item<K>, "id">) => {
      const created = { ...withUniqueName(item as Record<string, unknown>, "new"), id: newId() } as Item<K>
      return (await commit([...list, created], "Created")) ? created.id : undefined
    },
  }
}
