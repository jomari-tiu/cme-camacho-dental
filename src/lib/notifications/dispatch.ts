import type { Appointment, NotificationConfig, NotificationEvent, OutboxMessage, SiteContent } from "@/content/schema"
import { render, templateValues } from "./templates"
import { transport } from "./transport"

/** Which notification (if any) a change to an appointment should send. */
export function eventForChange(prev: Appointment, next: Appointment): NotificationEvent | null {
  if (prev.status !== next.status) {
    if (next.status === "confirmed") return "confirmed"
    if (next.status === "done") return "completed"
    if (next.status === "cancelled") return "cancelled"
    return null
  }
  const moved = prev.date !== next.date || prev.slot !== next.slot || prev.time !== next.time || prev.dentist !== next.dentist
  return moved && next.status !== "cancelled" && next.status !== "done" ? "rescheduled" : null
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

/**
 * Renders the enabled templates for an event. Messages that can't go out
 * (no consent, no email address) are kept as "skipped" so staff can see why.
 */
export function buildMessages(event: NotificationEvent, a: Appointment, content: SiteContent, config: NotificationConfig): OutboxMessage[] {
  const values = templateValues(a, content)
  const now = new Date().toISOString()
  const out: OutboxMessage[] = []
  for (const channel of ["sms", "email"] as const) {
    const template = config.templates.find((t) => t.event === event && t.channel === channel)
    if (!config.channels[channel] || !template?.enabled) continue
    const to = channel === "sms" ? a.phone : a.email.trim()
    const base = {
      id: newId(),
      createdAt: now,
      appointmentId: a.id,
      patientName: a.name,
      event,
      channel,
      to,
      subject: channel === "email" ? render(template.subject, values) : "",
      body: render(template.body, values),
      sentAt: null,
    }
    if (!a.consent) out.push({ ...base, status: "skipped", note: "Patient did not agree to receive updates" })
    else if (!to) out.push({ ...base, status: "skipped", note: channel === "email" ? "No email address" : "No mobile number" })
    else out.push({ ...base, status: "queued", note: "" })
  }
  return out
}

/** Sends queued messages through the configured transport and returns their final state. */
export async function deliver(messages: OutboxMessage[]): Promise<OutboxMessage[]> {
  return Promise.all(
    messages.map(async (m) => {
      if (m.status !== "queued") return m
      const result = await transport.send(m)
      if (result.status === "sent") return { ...m, status: "sent" as const, sentAt: new Date().toISOString(), note: "" }
      return { ...m, status: result.status, note: result.note }
    }),
  )
}

export type NotifyResult = { queued: number; sent: number; skipped: number; failed: number }

export const summarize = (list: OutboxMessage[]): NotifyResult => ({
  queued: list.filter((m) => m.status === "queued").length,
  sent: list.filter((m) => m.status === "sent").length,
  skipped: list.filter((m) => m.status === "skipped").length,
  failed: list.filter((m) => m.status === "failed").length,
})
