"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { Treatment } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Field, ImageListField, StringListEditor, TextField } from "@/components/admin/fields"
import { PageBody, PageHeader, SaveBar, Section } from "@/components/admin/page-chrome"
import { useContentDraft } from "@/components/admin/use-draft"

export function TreatmentEditor() {
  const { id } = useParams<{ id: string }>()
  const d = useContentDraft()
  const { draft, setDraft, ready, errorAt } = d
  const idx = draft.treatments.findIndex((x) => x.id === id)
  const t = draft.treatments[idx]

  if (!t) {
    return (
      <PageBody>
        <PageHeader title={ready ? "Treatment not found" : "Loading…"} />
        <Button variant="outline" className="justify-self-start" nativeButton={false} render={<Link href="/admin/treatments" />}>
          <ArrowLeft /> Back to treatments
        </Button>
      </PageBody>
    )
  }

  const set =
    <F extends keyof Treatment>(field: F) =>
    (value: Treatment[F]) =>
      setDraft((c) => ({ ...c, treatments: c.treatments.map((x) => (x.id === id ? { ...x, [field]: value } : x)) }))

  return (
    <PageBody>
      <Button variant="ghost" size="sm" className="-mb-4 justify-self-start" nativeButton={false} render={<Link href="/admin/treatments" />}>
        <ArrowLeft /> Treatments
      </Button>
      <PageHeader title={t.name || "Untitled treatment"} description="Shown in the treatment picker and booking form." />

      <Section title="Details">
        <TextField label="Name" value={t.name} onChange={set("name")} error={errorAt("treatments", idx, "name")} />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Duration" value={t.duration} onChange={set("duration")} placeholder="30–45 min" />
          <TextField label="Visits" value={t.visits} onChange={set("visits")} placeholder="1 visit" />
        </div>
        <TextField label="Description" value={t.description} onChange={set("description")} multiline rows={4} />
        <TextField label="Good for" value={t.goodFor} onChange={set("goodFor")} hint="Shown as “Good for: …”." />
        <Field label="Steps">
          <StringListEditor values={t.steps} onChange={set("steps")} errorAt={(i) => errorAt("treatments", idx, "steps", i)} addLabel="Add step" placeholder="Step description" />
        </Field>
      </Section>

      <Section title="Patient result photos" description="The first photo is shown by default; more photos appear as thumbnails.">
        <ImageListField
          label="Photos"
          values={t.images}
          onChange={set("images")}
          error={t.images.map((_, i) => errorAt("treatments", idx, "images", i)).find(Boolean)}
        />
        <TextField
          label="Placeholder text"
          value={t.placeholderHint}
          onChange={set("placeholderHint")}
          hint="Shown in the photo area when there are no photos."
        />
      </Section>

      <SaveBar draft={d} />
    </PageBody>
  )
}
