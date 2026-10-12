import type { Appointment, AppointmentStatus } from "@/content/schema"
import { Badge } from "@/components/ui/badge"
import { dateLabel } from "@/lib/schedule"
import { cn } from "@/lib/utils"

export const STATUS: Record<AppointmentStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  confirmed: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  done: { label: "Done", className: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge className={cn("border-0", STATUS[status].className)}>{STATUS[status].label}</Badge>
}

export const preferredLabel = (a: Appointment) =>
  a.slot ? dateLabel(a.date) + " · " + a.slot : (a.date ? dateLabel(a.date) : "Any day") + " · " + a.time

export const receivedLabel = (a: Appointment) =>
  new Date(a.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

/** Hour (0–23) of an exact slot, e.g. "9:00 AM" → 9; null when only a time of day was given. */
export function slotHour(a: Appointment): number | null {
  const fromKey = a.slotKey.split("|")[2]
  if (fromKey && /^\d+$/.test(fromKey)) return Number(fromKey)
  const m = a.slot.match(/^(\d{1,2}):\d{2}\s*(AM|PM)$/i)
  if (!m) return null
  const h = Number(m[1]) % 12
  return m[2].toUpperCase() === "PM" ? h + 12 : h
}

/** Sort key within a day: exact slots by hour, otherwise by time of day. */
export function sortHour(a: Appointment): number {
  const h = slotHour(a)
  if (h !== null) return h
  return /after/i.test(a.time) ? 13 : /even/i.test(a.time) ? 17 : 9
}

/** The dentist an appointment belongs to: by slot key id first (survives renames), then by name. */
export function appointmentDentist<D extends { id: string; shortName: string }>(a: Appointment, dentists: D[]): D | undefined {
  const id = a.slotKey.split("|")[0]
  return dentists.find((d) => d.id === id) ?? dentists.find((d) => d.shortName === a.dentist)
}
