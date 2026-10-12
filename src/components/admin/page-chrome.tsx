"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContentDraft } from "./use-draft"

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  )
}

export function SaveBar({ draft }: { draft: Pick<ContentDraft, "dirty" | "saving" | "save" | "discard" | "errorCount"> }) {
  if (!draft.dirty) return null
  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-background/95 py-2 pr-2 pl-4 shadow-lg backdrop-blur">
      {draft.errorCount > 0 ? (
        <span className="text-sm text-destructive">
          <span className="mr-2 inline-block size-2 rounded-full bg-destructive" />
          {draft.errorCount === 1 ? "1 field needs fixing" : `${draft.errorCount} fields need fixing`}
        </span>
      ) : (
        <span className="text-sm">
          <span className="mr-2 inline-block size-2 rounded-full bg-amber-500" />
          You have unsaved changes
        </span>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={draft.discard} disabled={draft.saving}>
          Discard
        </Button>
        <Button onClick={draft.save} disabled={draft.saving}>
          {draft.saving && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </div>
    </div>
  )
}

export function PageBody({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn("mx-auto grid w-full gap-6 p-4 md:p-8", wide ? "max-w-7xl" : "max-w-5xl")}>{children}</div>
}
