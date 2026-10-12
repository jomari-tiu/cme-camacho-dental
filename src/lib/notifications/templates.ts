import { z } from "zod"
import type {
  Appointment,
  MessageTemplate,
  NotificationChannel,
  NotificationConfig,
  NotificationEvent,
  SiteContent,
} from "@/content/schema"
import { dateLabel } from "@/lib/schedule"

export const EVENT_META: Record<NotificationEvent, { label: string; description: string; automatic: string }> = {
  request_received: {
    label: "Request received",
    description: "Right after a patient sends the booking form.",
    automatic: "When a booking request is submitted",
  },
  confirmed: {
    label: "Appointment confirmed",
    description: "When staff set the status to Confirmed.",
    automatic: "When status changes to Confirmed",
  },
  rescheduled: {
    label: "Appointment rescheduled",
    description: "When the date, time or dentist of a request changes.",
    automatic: "When date, time or dentist changes",
  },
  reminder: {
    label: "Day-before reminder",
    description: "The day before a confirmed visit. Needs the backend scheduler.",
    automatic: "Daily, by the backend scheduler",
  },
  completed: {
    label: "Visit completed",
    description: "When staff set the status to Done.",
    automatic: "When status changes to Done",
  },
  cancelled: {
    label: "Appointment cancelled",
    description: "When staff set the status to Cancelled.",
    automatic: "When status changes to Cancelled",
  },
}

export const VARIABLES = {
  firstName: "Patient's first name",
  patientName: "Patient's full name",
  treatment: "Treatment requested",
  dentist: "Dentist (or “any available dentist”)",
  date: "Visit date, e.g. Tue, Oct 13",
  time: "Exact time or time of day",
  clinicName: "Clinic name",
  clinicPhone: "Clinic main mobile number",
  clinicEmail: "Clinic email",
  clinicAddress: "Clinic address",
} as const
export type TemplateVariable = keyof typeof VARIABLES

const VAR_RE = /\{(\w+)\}/g

/** Values for one appointment. */
export function templateValues(a: Appointment, content: SiteContent): Record<TemplateVariable, string> {
  return {
    firstName: a.name.trim().split(/\s+/)[0] ?? "",
    patientName: a.name.trim(),
    treatment: a.treatment,
    dentist: a.dentist === "Any available" ? "any available dentist" : a.dentist,
    date: a.date ? dateLabel(a.date) : "a date to be confirmed",
    time: a.slot || a.time || "a time to be confirmed",
    clinicName: content.brand.name,
    clinicPhone: content.contact.primaryPhone,
    clinicEmail: content.contact.email,
    clinicAddress: content.contact.address,
  }
}

export const render = (text: string, values: Record<string, string>) => text.replace(VAR_RE, (m, k) => values[k] ?? m)

/** Sample patient used for previews in the template editor. */
export const SAMPLE_APPOINTMENT: Appointment = {
  id: "preview",
  createdAt: new Date().toISOString(),
  name: "Maria Santos",
  phone: "+63 917 123 4567",
  email: "maria@example.com",
  consent: true,
  treatment: "Oral Prophylaxis (Cleaning)",
  dentist: "Dr. Camacho",
  date: "2026-10-20",
  time: "Morning",
  slot: "10:00 AM",
  slotKey: "",
  notes: "",
  status: "confirmed",
}

/* ── SMS length ──────────────────────────────────────────────────────────── */

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
const GSM7_EXT = "^{}\\[~]|€"

/** Characters and SMS parts. Non-GSM characters (emoji, “smart quotes”) switch to Unicode: 70 chars per SMS. */
export function smsInfo(text: string) {
  let units = 0
  const special = new Set<string>()
  for (const ch of text) {
    if (GSM7.includes(ch)) units += 1
    else if (GSM7_EXT.includes(ch)) units += 2
    else special.add(ch)
  }
  const unicode = special.size > 0
  const length = unicode ? [...text].length : units
  const single = unicode ? 70 : 160
  const multi = unicode ? 67 : 153
  const parts = length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multi)
  return { length, parts, unicode, perPart: parts > 1 ? multi : single, special: [...special] }
}

/* ── Validation ──────────────────────────────────────────────────────────── */

const unknownVariables = (text: string) =>
  [...text.matchAll(VAR_RE)].map((m) => m[1]).filter((v) => !(v in VARIABLES))

const variablesOk = (label: string) =>
  z.string().superRefine((text, ctx) => {
    const unknown = unknownVariables(text)
    if (unknown.length) ctx.addIssue({ code: "custom", message: `${label}: unknown variable ${unknown.map((u) => `{${u}}`).join(", ")}.` })
    if (/\{[^}]*$/.test(text) || /^[^{]*\}/.test(text)) ctx.addIssue({ code: "custom", message: `${label}: a { or } is not closed.` })
  })

export const templateFormSchema = (channel: NotificationChannel) =>
  z.object({
    enabled: z.boolean(),
    subject:
      channel === "email"
        ? variablesOk("Subject").pipe(z.string().trim().min(1, "Subject is required.").max(150, "Keep the subject under 150 characters."))
        : z.string(),
    body: variablesOk("Message").pipe(
      z
        .string()
        .trim()
        .min(1, "Message is required.")
        .max(channel === "sms" ? 640 : 5000, channel === "sms" ? "SMS can be at most 640 characters (4 parts)." : "Email body is too long."),
    ),
  })

export const settingsFormSchema = z.object({
  channels: z.object({ sms: z.boolean(), email: z.boolean() }),
  senderName: z.string().trim().min(1, "Sender name is required.").max(40, "Keep it under 40 characters."),
  replyTo: z.union([z.literal(""), z.email("Enter a valid email address, e.g. name@example.com.")]),
})

/* ── Defaults ────────────────────────────────────────────────────────────── */

type Copy = { sms: string; subject: string; email: string }
const DEFAULT_COPY: Record<NotificationEvent, Copy> = {
  request_received: {
    sms: "Hi {firstName}, we got your request for {date} ({time}). We'll text or call to confirm. - {clinicName}",
    subject: "We received your appointment request",
    email:
      "Hi {firstName},\n\nThank you for choosing {clinicName}. We received your request for {treatment} on {date} ({time}) with {dentist}.\n\nWe'll text or call you to confirm your slot, usually within the day.\n\n{clinicName}\n{clinicAddress}\n{clinicPhone}",
  },
  confirmed: {
    sms: "Hi {firstName}, your visit is CONFIRMED: {date}, {time} with {dentist}. To reschedule, call {clinicPhone}. - {clinicName}",
    subject: "Your appointment is confirmed – {date}, {time}",
    email:
      "Hi {firstName},\n\nYour appointment is confirmed:\n\nTreatment: {treatment}\nDate: {date}\nTime: {time}\nDentist: {dentist}\n\nAddress: {clinicAddress}\n\nPlease arrive 10 minutes early. If you need to reschedule, call or text {clinicPhone}.\n\n{clinicName}",
  },
  rescheduled: {
    sms: "Hi {firstName}, your visit was moved to {date}, {time} with {dentist}. Questions? Call {clinicPhone}. - {clinicName}",
    subject: "Your appointment has been rescheduled",
    email:
      "Hi {firstName},\n\nYour appointment has been moved to:\n\nDate: {date}\nTime: {time}\nDentist: {dentist}\n\nIf this doesn't work for you, call or text {clinicPhone} and we'll find another slot.\n\n{clinicName}",
  },
  reminder: {
    sms: "Reminder: your visit at {clinicName} is tomorrow, {date} at {time}. Can't make it? Call {clinicPhone}.",
    subject: "Reminder: your appointment tomorrow at {time}",
    email:
      "Hi {firstName},\n\nThis is a reminder of your appointment tomorrow:\n\nTreatment: {treatment}\nDate: {date}\nTime: {time}\nDentist: {dentist}\n\nAddress: {clinicAddress}\n\nSee you soon!\n{clinicName}",
  },
  completed: {
    sms: "Thank you for visiting {clinicName}, {firstName}! For questions about your treatment, text or call {clinicPhone}.",
    subject: "Thank you for visiting {clinicName}",
    email:
      "Hi {firstName},\n\nThank you for visiting {clinicName} today. If you have any questions about your {treatment}, just reply to this email or call {clinicPhone}.\n\nWe recommend a check-up and cleaning every 6 months.\n\n{clinicName}",
  },
  cancelled: {
    sms: "Hi {firstName}, your appointment on {date} was cancelled. To book again, call {clinicPhone}. - {clinicName}",
    subject: "Your appointment has been cancelled",
    email:
      "Hi {firstName},\n\nYour appointment for {treatment} on {date} has been cancelled.\n\nIf this was a mistake or you'd like to book another time, call or text {clinicPhone}.\n\n{clinicName}",
  },
}

export const templateId = (event: NotificationEvent, channel: NotificationChannel) => `${event}-${channel}`

export function defaultTemplate(event: NotificationEvent, channel: NotificationChannel): MessageTemplate {
  const copy = DEFAULT_COPY[event]
  return {
    id: templateId(event, channel),
    event,
    channel,
    // The reminder needs a backend scheduler; everything else is on by default.
    enabled: event !== "reminder",
    subject: channel === "email" ? copy.subject : "",
    body: channel === "sms" ? copy.sms : copy.email,
    updatedAt: NEVER_EDITED,
  }
}

export function defaultNotificationConfig(senderName = "CME Camacho"): NotificationConfig {
  return {
    channels: { sms: true, email: true },
    senderName,
    replyTo: "",
    templates: (Object.keys(EVENT_META) as NotificationEvent[]).flatMap((e) => [defaultTemplate(e, "sms"), defaultTemplate(e, "email")]),
  }
}

const NEVER_EDITED = new Date(0).toISOString()

/**
 * Fills in templates missing from stored config (e.g. events added later), and keeps
 * never-edited templates on the latest default wording. Edited templates are left as they are.
 */
export function withAllTemplates(config: NotificationConfig): NotificationConfig {
  const defaults = defaultNotificationConfig(config.senderName).templates
  return {
    ...config,
    templates: defaults.map((d) => {
      const stored = config.templates.find((t) => t.id === d.id)
      return !stored || stored.updatedAt === NEVER_EDITED ? d : stored
    }),
  }
}
