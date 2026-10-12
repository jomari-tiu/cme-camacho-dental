"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { SectionId, SiteContent } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Field, StringListEditor, TextField } from "@/components/admin/fields"
import { LinkListEditor } from "@/components/admin/link-list-editor"
import { PageBody, PageHeader, SaveBar } from "@/components/admin/page-chrome"
import { SectionCard, SortableSections, type SortableSection } from "@/components/admin/sortable-sections"
import { bind, useContentDraft } from "@/components/admin/use-draft"
import { SECTION_META } from "@/lib/layout"

type Sections = SiteContent["sections"]

const LINK_HINT = (
  <>
    Add a link with <code>[text](https://…)</code>. Press Enter for a line break in titles.
  </>
)

export default function SectionsPage() {
  const d = useContentDraft()
  const { draft, setDraft, errorAt, hasErrorUnder } = d
  const supplies = bind(setDraft, "supplies")
  const booking = bind(setDraft, "booking")
  const nav = bind(setDraft, "nav")
  const footer = bind(setDraft, "footer")

  const sec =
    <K extends keyof Sections>(key: K) =>
    <F extends keyof Sections[K]>(field: F) =>
    (value: Sections[K][F]) =>
      setDraft((c) => ({ ...c, sections: { ...c.sections, [key]: { ...c.sections[key], [field]: value } } }))

  const setLayout = (sections: SiteContent["layout"]["sections"]) => setDraft((c) => ({ ...c, layout: { sections } }))

  const copyFields = (key: "treatments" | "dentists" | "schedule" | "faq" | "booking", introHint?: React.ReactNode) => {
    const s = draft.sections[key]
    const set = sec(key)
    return (
      <>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={s.eyebrow}
            onChange={set("eyebrow")}
            hint="Small label above the title. A leading “01 —” is renumbered to follow the section order."
          />
          <TextField label="Title" value={s.title} onChange={set("title")} error={errorAt("sections", key, "title")} multiline rows={2} />
        </div>
        <TextField label="Intro" value={s.intro} onChange={set("intro")} multiline rows={2} hint={introHint ?? "Leave empty to hide."} />
      </>
    )
  }

  const treatmentItems = draft.treatments.map((t) => ({ value: t.id, label: t.name }))

  const editors: Record<SectionId, React.ReactNode> = {
    hero: (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">The hero has its own page with the headline, photo and cards.</p>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/hero" />}>
          Edit hero <ArrowRight />
        </Button>
      </div>
    ),
    treatments: (
      <>
        {copyFields("treatments")}
        <LinkToList href="/admin/treatments" label="Manage treatments" />
      </>
    ),
    supplies: (
      <>
        <TextField label="Eyebrow" value={draft.supplies.eyebrow} onChange={supplies("eyebrow")} />
        <TextField label="Text" value={draft.supplies.text} onChange={supplies("text")} multiline />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Button label" value={draft.supplies.ctaLabel} onChange={supplies("ctaLabel")} error={errorAt("supplies", "ctaLabel")} />
          <TextField
            label="Button link"
            value={draft.supplies.ctaHref}
            onChange={supplies("ctaHref")}
            error={errorAt("supplies", "ctaHref")}
            hint="mailto:, tel: or https:// link."
          />
        </div>
      </>
    ),
    dentists: (
      <>
        {copyFields("dentists")}
        <LinkToList href="/admin/dentists" label="Manage dentists" />
      </>
    ),
    schedule: (
      <>
        {copyFields("schedule")}
        <TextField label="Footnote" value={draft.sections.schedule.note} onChange={sec("schedule")("note")} multiline rows={2} />
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="grid gap-1">
            <Label htmlFor="simulate">Simulate busy slots</Label>
            <p className="text-xs text-muted-foreground">
              Marks about a third of time slots as taken so the schedule looks realistic. Real requests always block their slot.
            </p>
          </div>
          <Switch id="simulate" checked={draft.booking.simulateBusySlots} onCheckedChange={(v) => booking("simulateBusySlots")(v)} />
        </div>
      </>
    ),
    faq: (
      <>
        {copyFields("faq", LINK_HINT)}
        <LinkToList href="/admin/faqs" label="Manage questions" />
      </>
    ),
    booking: (
      <>
        {copyFields("booking")}
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Submit button"
            value={draft.sections.booking.submitLabel}
            onChange={sec("booking")("submitLabel")}
            error={errorAt("sections", "booking", "submitLabel")}
          />
          <Field label="Pre-selected treatment">
            <Select items={treatmentItems} value={draft.booking.defaultTreatmentId} onValueChange={(v) => v && booking("defaultTreatmentId")(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treatmentItems.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <TextField
            label="Success title"
            value={draft.sections.booking.successTitle}
            onChange={sec("booking")("successTitle")}
            error={errorAt("sections", "booking", "successTitle")}
            hint={
              <>
                Use <code>{"{firstName}"}</code> and <code>{"{phone}"}</code>.
              </>
            }
          />
          <TextField label="Success text" value={draft.sections.booking.successText} onChange={sec("booking")("successText")} />
        </div>
        <Field label="Time-of-day options" hint="Shown when the patient doesn't pick an exact slot from the schedule." error={errorAt("booking", "timesOfDay")}>
          <StringListEditor
            values={draft.booking.timesOfDay}
            onChange={booking("timesOfDay")}
            errorAt={(i) => errorAt("booking", "timesOfDay", i)}
            addLabel="Add option"
          />
        </Field>
      </>
    ),
    visit: (
      <>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Label" value={draft.sections.visit.label} onChange={sec("visit")("label")} />
          <TextField
            label="Directions link text"
            value={draft.sections.visit.directionsLabel}
            onChange={sec("visit")("directionsLabel")}
            error={errorAt("sections", "visit", "directionsLabel")}
          />
        </div>
        <p className="text-xs text-muted-foreground">Address and map are edited under General &amp; contact.</p>
      </>
    ),
  }

  /** Content paths each section's editor covers, to flag cards that contain errors. */
  const errorPaths: Record<SectionId, string[]> = {
    hero: [],
    treatments: ["sections.treatments"],
    supplies: ["supplies"],
    dentists: ["sections.dentists"],
    schedule: ["sections.schedule"],
    faq: ["sections.faq"],
    booking: ["sections.booking", "booking"],
    visit: ["sections.visit"],
  }

  let n = 0
  const items: SortableSection[] = draft.layout.sections.map((s) => ({
    id: s.id,
    title: SECTION_META[s.id].label,
    description: SECTION_META[s.id].description,
    position: s.visible ? String(++n).padStart(2, "0") : "—",
    visible: s.visible,
    onVisibleChange: (visible: boolean) => setLayout(draft.layout.sections.map((x) => (x.id === s.id ? { ...x, visible } : x))),
    hasError: hasErrorUnder(...errorPaths[s.id]),
    children: editors[s.id],
  }))

  return (
    <PageBody>
      <PageHeader
        title="Sections & layout"
        description="Drag sections to change their order on the website, or switch them off to hide them. The navigation and footer stay fixed."
      />

      <div className="grid gap-2">
        <SectionCard
          locked
          title="Navigation"
          description="Top bar: logo, menu links and booking button"
          hasError={hasErrorUnder("nav")}
        >
          <div className="grid gap-2">
            <LinkListEditor
              title="Menu links"
              links={draft.nav.links}
              onChange={nav("links")}
              errorAt={(i, f) => errorAt("nav", "links", i, f)}
              hrefPlaceholder="#section"
            />
            <p className="text-xs text-muted-foreground">
              Section anchors: #treatments, #dentists, #schedule, #faq, #book, #visit. Links to hidden sections are left out automatically.
            </p>
          </div>
          <TextField label="Header button label" value={draft.nav.ctaLabel} onChange={nav("ctaLabel")} error={errorAt("nav", "ctaLabel")} className="max-w-sm" />
        </SectionCard>

        <SortableSections items={items} onReorder={(ids) => setLayout(ids.map((id) => draft.layout.sections.find((s) => s.id === id)!))} />

        <SectionCard locked title="Footer" description="Logo, copyright line and footer links" hasError={hasErrorUnder("footer")}>
          <TextField label="Copyright line" value={draft.footer.copyright} onChange={footer("copyright")} />
          <LinkListEditor
            title="Footer links"
            links={draft.footer.links}
            onChange={footer("links")}
            errorAt={(i, f) => errorAt("footer", "links", i, f)}
            hrefPlaceholder="https://… or mailto:…"
          />
          <p className="text-xs text-muted-foreground">The footer logo is set under General &amp; contact.</p>
        </SectionCard>
      </div>

      <SaveBar draft={d} />
    </PageBody>
  )
}

function LinkToList({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="outline" size="sm" className="justify-self-start" nativeButton={false} render={<Link href={href} />}>
      {label} <ArrowRight />
    </Button>
  )
}
