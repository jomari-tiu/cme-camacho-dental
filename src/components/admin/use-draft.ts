"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { siteContentSchema, type SiteContent } from "@/content/schema"
import { useCms } from "@/lib/cms-store"
import { issueMap } from "@/lib/validation"

/**
 * Local, unsaved copy of the site content for an admin page.
 * Changes only reach storage (and the public site) on save().
 */
export function useContentDraft() {
  const { content, ready, saveContent } = useCms()
  // null = no local edits, so the page follows stored content (initial load, other tabs).
  const [local, setLocal] = useState<SiteContent | null>(null)
  const [saving, setSaving] = useState(false)
  const draft = local ?? content
  const dirty = local !== null
  // Field errors are shown after the first save attempt, then update live while editing.
  const [showErrors, setShowErrors] = useState(false)
  const allErrors = useMemo(() => {
    const parsed = siteContentSchema.safeParse(draft)
    return parsed.success ? {} : issueMap(parsed.error)
  }, [draft])
  const errors = useMemo<Record<string, string>>(() => (showErrors ? allErrors : {}), [showErrors, allErrors])
  const errorCount = Object.keys(errors).length
  /** Error for a content path, e.g. errorAt("contact", "phones", 0, "number"). */
  const errorAt = useCallback((...path: (string | number)[]) => errors[path.join(".")] as string | undefined, [errors])
  /** True when any field under one of the given paths (e.g. "sections.faq") has an error. */
  const hasErrorUnder = useCallback(
    (...prefixes: string[]) => Object.keys(errors).some((k) => prefixes.some((p) => k === p || k.startsWith(p + "."))),
    [errors],
  )

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const setDraft = useCallback(
    (update: (d: SiteContent) => SiteContent) => setLocal((d) => update(d ?? content)),
    [content],
  )

  const save = useCallback(async () => {
    const issues = Object.keys(allErrors).length
    if (issues) {
      setShowErrors(true)
      toast.error(issues === 1 ? "1 field needs fixing" : `${issues} fields need fixing`, {
        description: "Check the highlighted fields, then save again.",
      })
      return false
    }
    setSaving(true)
    try {
      await saveContent(draft)
      setLocal(null)
      setShowErrors(false)
      toast.success("Changes saved", { description: "The website has been updated." })
      return true
    } catch (err) {
      console.error(err)
      const quota = err instanceof DOMException && err.name === "QuotaExceededError"
      toast.error("Could not save", {
        description: quota ? "Browser storage is full — try smaller images." : "Some fields are invalid. Please check your input.",
      })
      return false
    } finally {
      setSaving(false)
    }
  }, [allErrors, draft, saveContent])

  const discard = useCallback(() => {
    setLocal(null)
    setShowErrors(false)
  }, [])

  return { draft, setDraft, dirty, saving, save, discard, ready, errorAt, hasErrorUnder, errorCount }
}

export type ContentDraft = ReturnType<typeof useContentDraft>

type Obj = Record<string, unknown>
type ObjectKeys = { [K in keyof SiteContent]: SiteContent[K] extends unknown[] ? never : SiteContent[K] extends Obj ? K : never }[keyof SiteContent]

/** Field setter for one top-level object of the content, e.g. `const hero = bind(setDraft, "hero"); hero("headline")(v)`. */
export function bind<K extends ObjectKeys>(setDraft: ContentDraft["setDraft"], key: K) {
  return <F extends keyof SiteContent[K]>(field: F) =>
    (value: SiteContent[K][F]) =>
      setDraft((c) => ({ ...c, [key]: { ...(c[key] as Obj), [field]: value } }))
}
