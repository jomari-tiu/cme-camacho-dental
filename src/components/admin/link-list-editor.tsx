"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldMessage, ReorderButtons, move } from "./fields"

type Link = { label: string; href: string }

/** Label + link rows with validation messages. */
export function LinkListEditor({
  title,
  links,
  onChange,
  errorAt,
  hrefPlaceholder,
}: {
  title: string
  links: Link[]
  onChange: (links: Link[]) => void
  errorAt: (index: number, field: "label" | "href") => string | undefined
  hrefPlaceholder: string
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{title}</span>
      {links.map((l, i) => {
        const labelError = errorAt(i, "label")
        const hrefError = errorAt(i, "href")
        return (
          <div key={i} className="grid gap-1">
            <div className="flex items-center gap-2">
              <Input
                className="w-40"
                value={l.label}
                placeholder="Label"
                aria-invalid={!!labelError}
                onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                value={l.href}
                placeholder={hrefPlaceholder}
                aria-invalid={!!hrefError}
                onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
              />
              <ReorderButtons index={i} length={links.length} onMove={(a, b) => onChange(move(links, a, b))} />
              <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange(links.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </div>
            {(labelError || hrefError) && <FieldMessage>{labelError ?? hrefError}</FieldMessage>}
          </div>
        )
      })}
      <Button variant="outline" size="sm" className="justify-self-start" onClick={() => onChange([...links, { label: "", href: "" }])}>
        <Plus /> Add link
      </Button>
    </div>
  )
}
