"use client"

import { useState } from "react"
import { CalendarClock, ExternalLink, Mail, MessageSquare, Phone, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import type { Appointment, AppointmentStatus } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ANY_DENTIST } from "@/components/site/site-state"
import { useCms } from "@/lib/cms-store"
import { DOW_LONG, h12, hSlot, slotKey, timeOfDayFor } from "@/lib/schedule"
import { telHref } from "@/lib/text"
import { issueMap } from "@/lib/validation"
import { useAdminUser } from "./admin-shell"
import { STATUS, StatusBadge, appointmentDentist, preferredLabel, receivedLabel, slotHour } from "./appointment-utils"
import { ConfirmDelete, Field, FieldMessage } from "./fields"
import { ChannelIcon, OutboxStatusBadge, manualSendHref, shortTime } from "./outbox-utils"
import type { NotifyResult } from "@/lib/notifications/dispatch"
import { EVENT_META } from "@/lib/notifications/templates"

const STATUSES = Object.keys(STATUS) as AppointmentStatus[]
/** Select value for "Any available" (no dentist). */
const ANY = "any"
const statusItems = STATUSES.map((s) => ({ value: s, label: STATUS[s].label }))

export function StatusSelect({ value, onChange }: { value: AppointmentStatus; onChange: (s: AppointmentStatus) => void }) {
  return (
    <Select items={statusItems} value={value} onValueChange={(v) => v && onChange(v as AppointmentStatus)}>
      <SelectTrigger size="sm" className="w-32" onClick={(e) => e.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusItems.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** "SMS and email queued" style summary of what a change sent to the patient. */
export function notifySummary(r: NotifyResult | null): string | undefined {
  if (!r) return undefined
  const parts = [
    r.sent && `${r.sent} sent`,
    r.queued && `${r.queued} waiting in the Outbox`,
    r.failed && `${r.failed} failed`,
    r.skipped && `${r.skipped} not sent (no consent or address)`,
  ].filter(Boolean)
  return parts.length ? "Patient messages: " + parts.join(", ") + "." : undefined
}

export function useSetStatus() {
  const { updateAppointment } = useCms()
  return async (a: Appointment, status: AppointmentStatus) => {
    const result = await updateAppointment(a.id, { status })
    toast.success(`${a.name} marked as ${STATUS[status].label.toLowerCase()}`, { description: notifySummary(result) })
  }
}

/** Appointment details: status, contact, schedule (date/time/dentist), notes, delete (admin). */
export function AppointmentSheet({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  return (
    <Sheet open={!!appointment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">{appointment && <SheetBody key={appointment.id} a={appointment} onClose={onClose} />}</SheetContent>
    </Sheet>
  )
}

function SheetBody({ a, onClose }: { a: Appointment; onClose: () => void }) {
  const { updateAppointment, deleteAppointment } = useCms()
  const { isAdmin } = useAdminUser()
  const setStatus = useSetStatus()

  return (
    <>
      <SheetHeader>
        <SheetTitle>{a.name}</SheetTitle>
        <SheetDescription>Received {receivedLabel(a)}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-5 overflow-y-auto px-4 pb-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={a.status} />
          <StatusSelect value={a.status} onChange={(s) => setStatus(a, s)} />
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-sm">
          {[
            ["Mobile", a.phone],
            ["Email", a.email || "—"],
            ["Updates", a.consent ? "Agreed to SMS/email updates" : "Did not opt in to updates"],
            ["Treatment", a.treatment],
            ["Dentist", a.dentist],
            ["Scheduled", preferredLabel(a)],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={telHref(a.phone)} />}>
            <Phone /> Call
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={"sms:" + a.phone.replace(/\s/g, "")} />}>
            <MessageSquare /> Text
          </Button>
          {a.email && (
            <Button variant="outline" size="sm" nativeButton={false} render={<a href={"mailto:" + a.email} />}>
              <Mail /> Email
            </Button>
          )}
        </div>
        <Separator />
        <ScheduleEditor a={a} />
        <Separator />
        <PatientMessages appointmentId={a.id} />
        <Separator />
        <div className="grid gap-2">
          <Label>Patient notes</Label>
          <Textarea
            rows={4}
            defaultValue={a.notes}
            onBlur={(e) => e.target.value !== a.notes && updateAppointment(a.id, { notes: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Edits are saved when you leave the field.</p>
        </div>
      </div>
      {isAdmin && (
        <SheetFooter>
          <ConfirmDelete
            title="Delete this request?"
            description="This permanently removes the appointment request."
            onConfirm={async () => {
              await deleteAppointment(a.id)
              onClose()
              toast.success("Request deleted")
            }}
            trigger={<Button variant="destructive" className="w-full" />}
          />
        </SheetFooter>
      )}
    </>
  )
}

const scheduleSchema = z
  .object({
    date: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date."),
    time: z.string().min(1, "Choose a time."),
    dentist: z.string(),
  })
  .refine((s) => !(s.time.startsWith("h:") && !s.date), { path: ["date"], message: "Pick a date for an exact time." })

/** Confirm or change when (and with whom) the visit happens; it then shows at that slot on the calendar. */
function ScheduleEditor({ a }: { a: Appointment }) {
  const { content, appointments, updateAppointment } = useCms()
  const { isAdmin, session } = useAdminUser()
  const dentists = content.dentists
  const current = appointmentDentist(a, dentists)
  const hour = slotHour(a)
  const initial = {
    date: a.date,
    time: hour !== null ? `h:${hour}` : `tod:${a.time || content.booking.timesOfDay[0] || "Morning"}`,
    dentist: current?.id ?? ANY,
  }
  const [form, setForm] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const parsed = scheduleSchema.safeParse(form)
  const errors = submitted && !parsed.success ? issueMap(parsed.error) : {}

  const dentist = dentists.find((d) => d.id === form.dentist)
  const h = form.time.startsWith("h:") ? Number(form.time.slice(2)) : null
  const key = dentist && form.date && h !== null ? slotKey(dentist.id, form.date, h) : ""
  const clash = key ? appointments.find((x) => x.id !== a.id && x.status !== "cancelled" && x.slotKey === key) : undefined
  const day = form.date ? new Date(form.date + "T00:00").getDay() : null
  const range = dentist && day !== null ? dentist.hours[day] : undefined
  const outsideHours = dentist && day !== null && (!range || (h !== null && (h < range[0] || h >= range[1])))

  const hours = Array.from({ length: 14 }, (_, i) => i + 7)
  const timeItems = [
    ...content.booking.timesOfDay.map((t) => ({ value: `tod:${t}`, label: `${t} (flexible)` })),
    ...hours.map((x) => ({ value: `h:${x}`, label: hSlot(x) })),
  ]
  const dentistItems = [{ value: ANY, label: ANY_DENTIST }, ...dentists.map((d) => ({ value: d.id, label: d.shortName }))]

  const save = async () => {
    setSubmitted(true)
    if (!parsed.success) return
    if (clash) return toast.error("That slot is already booked", { description: `${clash.name} has ${hSlot(h!)} on that day.` })
    const result = await updateAppointment(a.id, {
      date: form.date,
      dentist: dentist?.shortName ?? ANY_DENTIST,
      slot: h !== null ? hSlot(h) : "",
      slotKey: key,
      time: h !== null ? timeOfDayFor(h, content.booking.timesOfDay) : form.time.slice(4),
    })
    setSubmitted(false)
    toast.success("Schedule updated", {
      description: [`${a.name} — ${form.date || "any day"}${h !== null ? " · " + hSlot(h) : ""}`, notifySummary(result)].filter(Boolean).join(" "),
    })
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="size-4" /> Schedule
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={errors.date}>
          <Input type="date" value={form.date} aria-invalid={!!errors.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Time" error={errors.time}>
          <Select items={timeItems} value={form.time} onValueChange={(v) => v && setForm((f) => ({ ...f, time: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Flexible</SelectLabel>
                {timeItems.filter((t) => t.value.startsWith("tod:")).map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Exact time</SelectLabel>
                {timeItems.filter((t) => t.value.startsWith("h:")).map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {isAdmin ? (
        <Field label="Dentist">
          <Select items={dentistItems} value={form.dentist} onValueChange={(v) => setForm((f) => ({ ...f, dentist: v ?? ANY }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dentistItems.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : (
        !current &&
        session.role === "dentist" && (
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setForm((f) => ({ ...f, dentist: session.dentistId }))}>
            Assign to me
          </Button>
        )
      )}
      {clash && <FieldMessage>{`Already booked: ${clash.name} at ${hSlot(h!)}.`}</FieldMessage>}
      {!clash && outsideHours && dentist && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-3.5" />
          {range
            ? `${dentist.shortName} works ${h12(range[0])}–${h12(range[1])} on ${DOW_LONG[day!]}s.`
            : `${dentist.shortName} is not in on ${DOW_LONG[day!]}s.`}
        </p>
      )}
      {dirty && (
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>
            Update schedule
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setForm(initial)
              setSubmitted(false)
            }}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}

/** Messages sent (or waiting) for this appointment. */
function PatientMessages({ appointmentId }: { appointmentId: string }) {
  const { outbox } = useCms()
  const { isAdmin } = useAdminUser()
  const list = outbox.filter((m) => m.appointmentId === appointmentId)
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4" /> Messages to patient
        </span>
        {isAdmin && (
          <a href="/admin/templates" className="text-xs text-muted-foreground underline underline-offset-2">
            Edit templates
          </a>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">None yet. Confirming, rescheduling, completing or cancelling sends one automatically.</p>
      ) : (
        <ul className="grid gap-1.5">
          {list.map((m) => (
            <li key={m.id} className="flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs">
              <ChannelIcon channel={m.channel} className="mt-0.5 size-3.5" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="font-medium">{EVENT_META[m.event].label}</span>
                <span className="text-muted-foreground">
                  {shortTime(m.createdAt)}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
              </div>
              <OutboxStatusBadge status={m.status} />
              {m.status === "queued" && m.to && (
                <a href={manualSendHref(m)} title="Send it yourself from this device" aria-label="Send manually" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
