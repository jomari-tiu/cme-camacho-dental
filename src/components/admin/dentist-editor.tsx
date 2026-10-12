"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { Dentist } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Field, ImageField, TagInput, TextField } from "@/components/admin/fields"
import { HoursEditor } from "@/components/admin/hours-editor"
import { PageBody, PageHeader, SaveBar, Section } from "@/components/admin/page-chrome"
import { useContentDraft } from "@/components/admin/use-draft"
import { daysText, dotColor, tintColor } from "@/lib/schedule"

/** Admin route: /admin/dentists/[id] */
export function DentistEditorRoute() {
  const { id } = useParams<{ id: string }>()
  return <DentistEditor id={id} mode="admin" />
}

/**
 * Edits one dentist profile. "self" is a dentist editing their own profile:
 * no back link, and the short name (which links appointment requests) is locked.
 */
export function DentistEditor({ id, mode }: { id: string; mode: "admin" | "self" }) {
  const self = mode === "self"
  const d = useContentDraft()
  const { draft, setDraft, ready, errorAt } = d
  const idx = draft.dentists.findIndex((x) => x.id === id)
  const dentist = draft.dentists[idx]

  if (!dentist) {
    return (
      <PageBody>
        <PageHeader title={ready ? "Dentist not found" : "Loading…"} />
        <Button variant="outline" className="justify-self-start" nativeButton={false} render={<Link href="/admin/dentists" />}>
          <ArrowLeft /> Back to dentists
        </Button>
      </PageBody>
    )
  }

  const set =
    <F extends keyof Dentist>(field: F) =>
    (value: Dentist[F]) =>
      setDraft((c) => ({ ...c, dentists: c.dentists.map((x) => (x.id === id ? { ...x, [field]: value } : x)) }))

  return (
    <PageBody>
      {!self && (
        <Button variant="ghost" size="sm" className="-mb-4 justify-self-start" nativeButton={false} render={<Link href="/admin/dentists" />}>
          <ArrowLeft /> Dentists
        </Button>
      )}
      <PageHeader
        title={self ? "My profile & hours" : dentist.name || "Untitled dentist"}
        description={self ? "Changes appear on the website’s Dentists and Schedule sections after you save." : daysText(dentist.hours)}
      />

      <Section title="Profile">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <ImageField label="Portrait" value={dentist.photo} onChange={set("photo")} error={errorAt("dentists", idx, "photo")} aspect="aspect-[4/5]" maxSize={1000} />
          <div className="grid content-start gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Full name" value={dentist.name} onChange={set("name")} error={errorAt("dentists", idx, "name")} hint="Shown on the profile card." />
              <TextField
                label="Short name"
                value={dentist.shortName}
                onChange={set("shortName")}
                error={errorAt("dentists", idx, "shortName")}
                disabled={self}
                hint={self ? "Links your appointment requests. Ask the clinic admin to change it." : "Used in the schedule and booking form."}
              />
            </div>
            <TextField label="Role" value={dentist.role} onChange={set("role")} />
            <TextField label="Bio" value={dentist.bio} onChange={set("bio")} multiline rows={3} />
            <Field label="Specialties">
              <TagInput values={dentist.tags} onChange={set("tags")} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Colour" description="Identifies this dentist in the schedule.">
        <div className="flex items-center gap-4">
          <span className="size-8 shrink-0 rounded-lg" style={{ background: tintColor(dentist.hue) }} />
          <span className="size-3 shrink-0 rounded-full" style={{ background: dotColor(dentist.hue) }} />
          <Slider
            value={dentist.hue}
            min={0}
            max={360}
            step={1}
            onValueChange={(v) => set("hue")(Array.isArray(v) ? v[0] : v)}
            className="max-w-md"
            aria-label="Hue"
          />
          <span className="w-10 font-mono text-xs text-muted-foreground">{dentist.hue}°</span>
        </div>
      </Section>

      <Section title="Weekly hours" description="One-hour appointment slots are generated from these hours.">
        <HoursEditor hours={dentist.hours} onChange={set("hours")} />
      </Section>

      <SaveBar draft={d} />
    </PageBody>
  )
}
