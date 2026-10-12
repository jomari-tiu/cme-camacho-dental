import type { OutboxMessage } from "@/content/schema"

/**
 * Delivery boundary for SMS and email. The app only ever calls `transport.send()`,
 * so connecting a real backend is a matter of configuration, not code changes.
 *
 * Backend contract (when NEXT_PUBLIC_NOTIFICATIONS_API_URL is set):
 *   POST {url}
 *   { id, channel: "sms" | "email", to, subject, body, event, appointmentId }
 *   → 2xx when the message was accepted for delivery.
 * The backend chooses the provider (e.g. an Android SMS gateway with the clinic SIM,
 * or an SMS/email service) and keeps API keys on the server.
 */
export type SendResult = { status: "sent" } | { status: "queued"; note: string } | { status: "failed"; note: string }

export interface NotificationTransport {
  /** True when messages actually leave the system. */
  connected: boolean
  label: string
  send(message: OutboxMessage): Promise<SendResult>
}

/** No backend yet: messages wait in the outbox (they can be sent by hand from there). */
export const queueOnlyTransport: NotificationTransport = {
  connected: false,
  label: "Not connected — messages wait in the outbox",
  async send() {
    return { status: "queued", note: "Waiting for a backend to deliver it" }
  },
}

export function httpTransport(url: string): NotificationTransport {
  return {
    connected: true,
    label: "Connected to the notifications backend",
    async send(m) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: m.id, channel: m.channel, to: m.to, subject: m.subject, body: m.body, event: m.event, appointmentId: m.appointmentId }),
        })
        return res.ok ? { status: "sent" } : { status: "failed", note: `Backend responded ${res.status}` }
      } catch {
        return { status: "failed", note: "Could not reach the notifications backend" }
      }
    },
  }
}

const apiUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL
export const transport: NotificationTransport = apiUrl ? httpTransport(apiUrl) : queueOnlyTransport
