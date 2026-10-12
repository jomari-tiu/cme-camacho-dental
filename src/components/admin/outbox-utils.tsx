import { Mail, MessageSquare } from "lucide-react"
import type { OutboxMessage, OutboxStatus } from "@/content/schema"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const OUTBOX_STATUS: Record<OutboxStatus, { label: string; className: string }> = {
  queued: { label: "Waiting", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  sent: { label: "Sent", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
  skipped: { label: "Not sent", className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300" },
}

export function OutboxStatusBadge({ status }: { status: OutboxStatus }) {
  return <Badge className={cn("border-0", OUTBOX_STATUS[status].className)}>{OUTBOX_STATUS[status].label}</Badge>
}

export function ChannelIcon({ channel, className }: { channel: OutboxMessage["channel"]; className?: string }) {
  return channel === "sms" ? (
    <MessageSquare className={cn("size-4 text-muted-foreground", className)} aria-label="SMS" />
  ) : (
    <Mail className={cn("size-4 text-muted-foreground", className)} aria-label="Email" />
  )
}

/** Opens the device's SMS or mail app with the message filled in (manual sending). */
export function manualSendHref(m: OutboxMessage) {
  if (m.channel === "sms") return `sms:${m.to.replace(/\s/g, "")}?body=${encodeURIComponent(m.body)}`
  return `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`
}

export const shortTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
