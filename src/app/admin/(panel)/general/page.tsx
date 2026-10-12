"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldMessage, ImageField, PhoneField, PhoneMaskInput, ReorderButtons, TextField, move } from "@/components/admin/fields"
import { PageBody, PageHeader, SaveBar, Section } from "@/components/admin/page-chrome"
import { bind, useContentDraft } from "@/components/admin/use-draft"

export default function GeneralPage() {
  const d = useContentDraft()
  const { draft, setDraft, errorAt } = d
  const brand = bind(setDraft, "brand")
  const contact = bind(setDraft, "contact")
  const seo = bind(setDraft, "seo")
  const { phones } = draft.contact

  return (
    <PageBody>
      <PageHeader title="General & contact" description="Clinic name, logos, contact details, map and search-engine text. Footer links are under Sections & layout." />

      <Section title="Brand">
        <TextField
          label="Clinic name"
          value={draft.brand.name}
          onChange={brand("name")}
          error={errorAt("brand", "name")}
          hint="Used as image alt text and in the admin."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <ImageField
            label="Header logo"
            value={draft.brand.logoNav}
            onChange={brand("logoNav")}
            error={errorAt("brand", "logoNav")}
            aspect="aspect-[3/1]"
            fit="contain"
            maxSize={800}
          />
          <ImageField
            label="Logo mark (hero card)"
            value={draft.brand.logoMark}
            onChange={brand("logoMark")}
            error={errorAt("brand", "logoMark")}
            aspect="aspect-[3/1]"
            fit="contain"
            dark
            maxSize={600}
          />
          <ImageField
            label="Footer logo"
            value={draft.brand.logoFooter}
            onChange={brand("logoFooter")}
            error={errorAt("brand", "logoFooter")}
            aspect="aspect-[3/1]"
            fit="contain"
            dark
            maxSize={1200}
          />
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-5 md:grid-cols-2">
          <PhoneField
            label="Main mobile number"
            value={draft.contact.primaryPhone}
            onChange={contact("primaryPhone")}
            error={errorAt("contact", "primaryPhone")}
            hint="Shown as the hero call button. Format: +63 9XX XXX XXXX"
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            value={draft.contact.email}
            onChange={contact("email")}
            error={errorAt("contact", "email")}
            placeholder="name@example.com"
          />
          <TextField
            label="Messenger link"
            type="url"
            value={draft.contact.messengerUrl}
            onChange={contact("messengerUrl")}
            error={errorAt("contact", "messengerUrl")}
            placeholder="https://m.me/…"
          />
          <TextField
            label="Facebook page"
            type="url"
            value={draft.contact.facebookUrl}
            onChange={contact("facebookUrl")}
            error={errorAt("contact", "facebookUrl")}
            placeholder="https://www.facebook.com/…"
          />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Mobile numbers (booking section)</span>
          {phones.map((p, i) => {
            const labelError = errorAt("contact", "phones", i, "label")
            const numberError = errorAt("contact", "phones", i, "number")
            return (
              <div key={i} className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    className="w-32"
                    value={p.label}
                    placeholder="Label"
                    aria-invalid={!!labelError}
                    onChange={(e) => contact("phones")(phones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  />
                  <PhoneMaskInput
                    value={p.number}
                    invalid={!!numberError}
                    onChange={(number) => contact("phones")(phones.map((x, j) => (j === i ? { ...x, number } : x)))}
                  />
                  <ReorderButtons index={i} length={phones.length} onMove={(a, b) => contact("phones")(move(phones, a, b))} />
                  <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => contact("phones")(phones.filter((_, j) => j !== i))}>
                    <X />
                  </Button>
                </div>
                {(labelError || numberError) && <FieldMessage>{labelError ?? numberError}</FieldMessage>}
              </div>
            )
          })}
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => contact("phones")([...phones, { label: "", number: "" }])}>
            <Plus /> Add number
          </Button>
        </div>
      </Section>

      <Section title="Location">
        <TextField label="Address" value={draft.contact.address} onChange={contact("address")} error={errorAt("contact", "address")} multiline rows={2} />
        <TextField
          label="Google Maps embed URL"
          type="url"
          value={draft.contact.mapEmbedUrl}
          onChange={contact("mapEmbedUrl")}
          error={errorAt("contact", "mapEmbedUrl")}
          hint={
            <>
              Format: <code>https://www.google.com/maps?q=Your+Address&amp;output=embed</code>
            </>
          }
        />
        <TextField
          label="Directions link"
          type="url"
          value={draft.contact.directionsUrl}
          onChange={contact("directionsUrl")}
          error={errorAt("contact", "directionsUrl")}
        />
      </Section>

      <Section title="Search engines" description="Title and description shown in Google results and browser tabs.">
        <TextField label="Page title" value={draft.seo.title} onChange={seo("title")} error={errorAt("seo", "title")} />
        <TextField label="Meta description" value={draft.seo.description} onChange={seo("description")} multiline />
      </Section>

      <SaveBar draft={d} />
    </PageBody>
  )
}
