"use client"

import { ImageField, TextField } from "@/components/admin/fields"
import { PageBody, PageHeader, SaveBar, Section } from "@/components/admin/page-chrome"
import { bind, useContentDraft } from "@/components/admin/use-draft"

export default function HeroPage() {
  const d = useContentDraft()
  const { draft, setDraft, errorAt } = d
  const hero = bind(setDraft, "hero")
  const h = draft.hero

  return (
    <PageBody>
      <PageHeader title="Hero" description="The first thing visitors see at the top of the page." />
      <Section title="Text">
        <TextField label="Badge" value={h.badge} onChange={hero("badge")} hint="Small line above the headline (location, opening days)." />
        <TextField label="Headline" value={h.headline} onChange={hero("headline")} error={errorAt("hero", "headline")} multiline rows={2} hint="Press Enter for a line break." />
        <TextField label="Intro text" value={h.subtext} onChange={hero("subtext")} multiline />
        <TextField label="Main button label" value={h.primaryCtaLabel} onChange={hero("primaryCtaLabel")} error={errorAt("hero", "primaryCtaLabel")} hint="Scrolls to the appointment form." />
      </Section>
      <Section title="Visuals">
        <ImageField label="Hero photo" value={h.image} onChange={hero("image")} error={errorAt("hero", "image")} aspect="aspect-[16/9]" />
        <div className="grid gap-5 md:grid-cols-3">
          <TextField label="Dark card text" value={h.darkCardText} onChange={hero("darkCardText")} />
          <TextField label="Mint card label" value={h.mintCardLabel} onChange={hero("mintCardLabel")} />
          <TextField label="Mint card link text" value={h.mintCardLinkText} onChange={hero("mintCardLinkText")} error={errorAt("hero", "mintCardLinkText")} hint="Links to Messenger (General → Contact)." />
        </div>
      </Section>
      <SaveBar draft={d} />
    </PageBody>
  )
}
