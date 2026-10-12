import { z } from "zod"
import { normalizePh } from "@/lib/phone"
import * as v from "@/lib/validation"

/** Page sections that can be reordered/hidden. The header and footer are fixed. */
export const SECTION_IDS = ["hero", "treatments", "supplies", "dentists", "schedule", "faq", "booking", "visit"] as const
export type SectionId = (typeof SECTION_IDS)[number]
export const sectionRef = z.object({ id: z.enum(SECTION_IDS), visible: z.boolean() })
export type SectionRef = z.infer<typeof sectionRef>

/** [startHour, endHour) in 24h time, or null when the dentist is not in. */
export const hourRange = z
  .tuple([z.number().int().min(0).max(23), z.number().int().min(1).max(24)])
  .refine(([a, b]) => a < b, "End time must be after start time.")
  .nullable()

/**
 * Builds the content schema. `strict` applies the field-format rules used when
 * saving from the CMS; the loose variant only checks structure, so content saved
 * before a rule existed still loads instead of being thrown away.
 */
function buildContentSchema(strict: boolean) {
  const s = z.string()
  const req = (label?: string) => (strict ? v.required(label) : s)
  const phone = strict ? v.phMobile : z.preprocess((x) => (typeof x === "string" ? normalizePh(x) : x), s)
  const email = strict ? v.email : s
  const https = strict ? v.httpsUrl : s
  const href = strict ? v.linkHref : s
  const image = strict ? v.imageSrc : s
  const requiredImage = strict ? v.requiredImage : s

  const link = z.object({ label: req("Label"), href })
  const sectionCopy = z.object({ eyebrow: s, title: req("Title"), intro: s })

  const treatment = z.object({
    id: z.string(),
    name: req("Name"),
    images: z.array(requiredImage),
    duration: s,
    visits: s,
    description: s,
    steps: z.array(req("Step")),
    goodFor: s,
    placeholderHint: s,
  })

  const dentist = z.object({
    id: z.string(),
    shortName: req("Short name"),
    name: req("Full name"),
    role: s,
    bio: s,
    tags: z.array(z.string()),
    photo: image,
    hue: z.number().min(0).max(360),
    /** Indexed by Date.getDay(): 0 = Sunday … 6 = Saturday. */
    hours: z.array(hourRange).length(7),
  })

  const faq = z.object({ id: z.string(), question: req("Question"), answer: req("Answer") })

  const schema = z.object({
    version: z.literal(1),
    seo: z.object({ title: req("Page title"), description: s }),
    brand: z.object({
      name: req("Clinic name"),
      logoNav: requiredImage,
      logoMark: image,
      logoFooter: image,
    }),
    contact: z.object({
      primaryPhone: phone,
      phones: z.array(z.object({ label: req("Label"), number: phone })),
      email,
      messengerUrl: https,
      facebookUrl: https,
      address: req("Address"),
      mapEmbedUrl: https,
      directionsUrl: https,
    }),
    nav: z.object({ links: z.array(link), ctaLabel: req("Button label") }),
    hero: z.object({
      badge: s,
      headline: req("Headline"),
      subtext: s,
      primaryCtaLabel: req("Button label"),
      image,
      darkCardText: s,
      mintCardLabel: s,
      mintCardLinkText: req("Link text"),
    }),
    sections: z.object({
      treatments: sectionCopy,
      dentists: sectionCopy,
      schedule: sectionCopy.extend({ note: s }),
      faq: sectionCopy,
      booking: sectionCopy.extend({
        successTitle: req("Success title"),
        successText: s,
        submitLabel: req("Button label"),
      }),
      visit: z.object({ label: s, directionsLabel: req("Link text") }),
    }),
    supplies: z.object({ eyebrow: s, text: s, ctaLabel: req("Button label"), ctaHref: href }),
    layout: z.object({
      sections: strict
        ? z
            .array(sectionRef)
            .refine((l) => SECTION_IDS.every((id) => l.filter((x) => x.id === id).length === 1), "Each section must appear exactly once.")
        : z.array(sectionRef),
    }),
    treatments: z.array(treatment),
    dentists: z.array(dentist),
    faqs: z.array(faq),
    booking: z.object({
      timesOfDay: strict ? z.array(req("Option")).min(1, "Add at least one option.") : z.array(s),
      defaultTreatmentId: z.string(),
      /** Mark some slots as taken (deterministic) so the demo schedule looks realistic. */
      simulateBusySlots: z.boolean(),
    }),
    footer: z.object({ copyright: s, links: z.array(link) }),
  })

  if (!strict) return schema
  // The booking form identifies treatments and dentists by name, so names must be unique.
  return schema.superRefine((c, ctx) => {
    const dupes = (names: string[], path: (i: number) => (string | number)[], what: string) => {
      const seen = new Set<string>()
      names.forEach((n, i) => {
        const key = n.trim().toLowerCase()
        if (key && seen.has(key)) ctx.addIssue({ code: "custom", path: path(i), message: `Another ${what} already uses this name.` })
        seen.add(key)
      })
    }
    dupes(c.treatments.map((t) => t.name), (i) => ["treatments", i, "name"], "treatment")
    dupes(c.dentists.map((d) => d.shortName), (i) => ["dentists", i, "shortName"], "dentist")
  })
}

/** Strict: used when saving from the CMS and importing backups. */
export const siteContentSchema = buildContentSchema(true)
/** Structure-only: used when reading what is already in storage. */
export const storedContentSchema = buildContentSchema(false)

export const appointmentStatus = z.enum(["new", "confirmed", "done", "cancelled"])

export const appointmentSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  name: z.string(),
  /** Normalised to "+63 9XX XXX XXXX" when it can be. */
  phone: z.preprocess((x) => (typeof x === "string" ? normalizePh(x) : x), z.string()),
  treatment: z.string(),
  dentist: z.string(),
  /** ISO date (yyyy-mm-dd) or empty for "any day". */
  date: z.string(),
  time: z.string(),
  /** Exact slot label like "9:00 AM" when picked from the schedule. */
  slot: z.string(),
  /** `${dentistId}|${date}|${hour}` when picked from the schedule. */
  slotKey: z.string(),
  notes: z.string(),
  status: appointmentStatus,
  /** Optional email for updates (older requests have none). */
  email: z.string().default(""),
  /** Patient agreed to receive appointment updates by SMS/email. */
  consent: z.boolean().default(false),
})

/** Login for a dentist, linked to one dentist profile. Passwords are stored as PBKDF2 hashes. */
export const dentistAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  dentistId: z.string(),
  passwordHash: z.string(),
  salt: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
})

/* ── Notifications ─────────────────────────────────────────────────────────── */

export const NOTIFICATION_EVENTS = ["request_received", "confirmed", "rescheduled", "reminder", "completed", "cancelled"] as const
export const notificationEvent = z.enum(NOTIFICATION_EVENTS)
export const notificationChannel = z.enum(["sms", "email"])

export const messageTemplateSchema = z.object({
  id: z.string(),
  event: notificationEvent,
  channel: notificationChannel,
  enabled: z.boolean(),
  /** Email only. */
  subject: z.string(),
  body: z.string(),
  updatedAt: z.string(),
})

export const notificationConfigSchema = z.object({
  channels: z.object({ sms: z.boolean(), email: z.boolean() }),
  /** Shown as the SMS sender (when the provider supports a sender name) and email "From" name. */
  senderName: z.string(),
  /** Where patients' email replies go. */
  replyTo: z.string(),
  templates: z.array(messageTemplateSchema),
})

export const outboxStatus = z.enum(["queued", "sent", "failed", "skipped"])

/** A rendered message, waiting for (or sent through) the delivery backend. */
export const outboxMessageSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  appointmentId: z.string(),
  patientName: z.string(),
  event: notificationEvent,
  channel: notificationChannel,
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  status: outboxStatus,
  /** Why it was skipped/failed, or how it was sent ("manually"). */
  note: z.string(),
  sentAt: z.string().nullable(),
})

export const backupSchema = z.object({
  content: siteContentSchema,
  appointments: z.array(appointmentSchema).optional(),
  accounts: z.array(dentistAccountSchema).optional(),
  notifications: notificationConfigSchema.optional(),
})

export type SiteContent = z.output<typeof storedContentSchema>
export type Treatment = SiteContent["treatments"][number]
export type Dentist = SiteContent["dentists"][number]
export type Faq = SiteContent["faqs"][number]
export type HourRange = z.infer<typeof hourRange>
export type Appointment = z.infer<typeof appointmentSchema>
export type AppointmentStatus = z.infer<typeof appointmentStatus>
export type DentistAccount = z.infer<typeof dentistAccountSchema>
export type NotificationEvent = z.infer<typeof notificationEvent>
export type NotificationChannel = z.infer<typeof notificationChannel>
export type MessageTemplate = z.infer<typeof messageTemplateSchema>
export type NotificationConfig = z.infer<typeof notificationConfigSchema>
export type OutboxStatus = z.infer<typeof outboxStatus>
export type OutboxMessage = z.infer<typeof outboxMessageSchema>
