"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react"
import type { Appointment, Dentist } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminUser } from "./admin-shell"
import { AppointmentSheet } from "./appointment-sheet"
import { StatusBadge, appointmentDentist, slotHour, sortHour } from "./appointment-utils"
import { useVisibleAppointments } from "./use-visible-appointments"
import { useCms } from "@/lib/cms-store"
import { DOW_LONG, MON, MONTHS, dotColor, hRange, hSlot, iso, tintColor } from "@/lib/schedule"
import { cn } from "@/lib/utils"

type View = "month" | "week"
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const NEUTRAL = "oklch(0.7 0 0)"

const parse = (d: string) => new Date(d + "T00:00")
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
const noop = () => () => {}

/** Today's date, client-only (the server's timezone may differ from the clinic's). */
function useToday() {
  return useSyncExternalStore(noop, () => iso(new Date()), () => "")
}

/** Appointment calendar (month/week, day panel, reschedule sheet). Used on the dashboard and the Calendar page. */
export function AppointmentCalendar() {
  const today = useToday()
  return today ? <CalendarView today={today} /> : <div className="min-h-96" />
}

function CalendarView({ today }: { today: string }) {
  const { content } = useCms()
  const { isAdmin, dentist: me } = useAdminUser()
  const all = useVisibleAppointments()
  const dentists = content.dentists

  const [view, setView] = useState<View>("month")
  const [selected, setSelected] = useState(today)
  const [dentistFilter, setDentistFilter] = useState("all")
  const [showCancelled, setShowCancelled] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const focus = isAdmin ? dentists.find((d) => d.id === dentistFilter) : (me ?? undefined)
  const appts = useMemo(
    () =>
      all.filter((a) => {
        if (!showCancelled && a.status === "cancelled") return false
        if (isAdmin && dentistFilter !== "all") return appointmentDentist(a, dentists)?.id === dentistFilter
        return true
      }),
    [all, showCancelled, isAdmin, dentistFilter, dentists],
  )
  const byDate = useMemo(() => {
    const m = new Map<string, Appointment[]>()
    for (const a of appts) if (a.date) m.set(a.date, [...(m.get(a.date) ?? []), a])
    for (const list of m.values()) list.sort((x, y) => sortHour(x) - sortHour(y))
    return m
  }, [appts])
  const unscheduled = appts.filter((a) => !a.date && a.status !== "done" && a.status !== "cancelled")
  const open = all.find((a) => a.id === openId) ?? null

  const sel = parse(selected)
  const move = (dir: -1 | 1) =>
    setSelected(iso(view === "month" ? new Date(sel.getFullYear(), sel.getMonth() + dir, 1) : addDays(sel, 7 * dir)))

  const title =
    view === "month"
      ? `${MONTHS[sel.getMonth()]} ${sel.getFullYear()}`
      : (() => {
          const a = mondayOf(sel)
          const b = addDays(a, 6)
          return `${MON[a.getMonth()]} ${a.getDate()} – ${a.getMonth() !== b.getMonth() ? MON[b.getMonth()] + " " : ""}${b.getDate()}, ${b.getFullYear()}`
        })()

  const colorOf = (a: Appointment) => {
    const d = appointmentDentist(a, dentists)
    return d ? dotColor(d.hue) : NEUTRAL
  }
  const filterItems = [{ value: "all", label: "All dentists" }, ...dentists.map((d) => ({ value: d.id, label: d.shortName }))]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous" onClick={() => move(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next" onClick={() => move(1)}>
            <ChevronRight />
          </Button>
          <Button variant="outline" onClick={() => setSelected(today)}>
            Today
          </Button>
          <h2 className="ml-2 text-lg font-semibold tabular-nums">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Select items={filterItems} value={dentistFilter} onValueChange={(v) => v && setDentistFilter(v)}>
              <SelectTrigger className="w-44" aria-label="Filter by dentist">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterItems.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-2">
            <Switch id="show-cancelled" checked={showCancelled} onCheckedChange={setShowCancelled} />
            <Label htmlFor="show-cancelled">Show cancelled</Label>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden py-0">
          {view === "month" ? (
            <MonthGrid
              today={today}
              selected={selected}
              byDate={byDate}
              colorOf={colorOf}
              onSelect={setSelected}
              onOpen={setOpenId}
              focus={focus}
            />
          ) : (
            <WeekGrid today={today} selected={selected} byDate={byDate} dentists={focus ? [focus] : dentists} colorOf={colorOf} onSelect={setSelected} onOpen={setOpenId} />
          )}
        </Card>

        <div className="grid gap-4">
          <DayPanel date={selected} today={today} list={byDate.get(selected) ?? []} dentists={focus ? [focus] : dentists} colorOf={colorOf} onOpen={setOpenId} />
          {unscheduled.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Needs a date</CardTitle>
                <CardDescription>Requests without a preferred day. Open one to schedule it.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1.5">
                {unscheduled.map((a) => (
                  <AppointmentRow key={a.id} a={a} color={colorOf(a)} onOpen={setOpenId} />
                ))}
              </CardContent>
            </Card>
          )}
          <Legend dentists={isAdmin ? dentists : me ? [me] : []} />
        </div>
      </div>

      <AppointmentSheet appointment={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

/** Short time label for chips: "9 AM" for exact slots, the time of day otherwise. */
const timeLabel = (a: Appointment) => {
  const h = slotHour(a)
  return h !== null ? hSlot(h).replace(":00", "") : a.time
}

function Chip({ a, color, onOpen }: { a: Appointment; color: string; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(a.id)
      }}
      title={`${timeLabel(a)} · ${a.name} · ${a.treatment}`}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded-sm border-l-2 bg-muted/70 px-1 py-0.5 text-left text-[11px] leading-tight hover:bg-muted",
        a.status === "cancelled" && "line-through opacity-50",
        a.status === "done" && "opacity-60",
        a.status === "new" && "font-semibold",
      )}
      style={{ borderLeftColor: color }}
    >
      <span className="shrink-0 tabular-nums text-muted-foreground">{timeLabel(a)}</span>
      <span className="truncate">{a.name}</span>
    </button>
  )
}

function MonthGrid({
  today,
  selected,
  byDate,
  colorOf,
  onSelect,
  onOpen,
  focus,
}: {
  today: string
  selected: string
  byDate: Map<string, Appointment[]>
  colorOf: (a: Appointment) => string
  onSelect: (d: string) => void
  onOpen: (id: string) => void
  focus?: Dentist
}) {
  const sel = parse(selected)
  const first = new Date(sel.getFullYear(), sel.getMonth(), 1)
  const start = mondayOf(first)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => addDays(start, i))

  return (
    <div>
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = iso(d)
          const list = byDate.get(key) ?? []
          const inMonth = d.getMonth() === sel.getMonth()
          const off = focus && !focus.hours[d.getDay()]
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(key))}
              aria-label={`${DOW_LONG[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}: ${list.length} appointment${list.length === 1 ? "" : "s"}`}
              aria-pressed={key === selected}
              className={cn(
                "flex min-h-24 min-w-0 cursor-pointer flex-col gap-1 border-r border-b p-1.5 text-left outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset sm:min-h-28 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
                off && inMonth && "bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--color-muted)_6px_7px)]",
                key === selected && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  key === today && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {d.getDate()}
              </span>
              <div className="hidden min-w-0 gap-0.5 sm:grid">
                {list.slice(0, 3).map((a) => (
                  <Chip key={a.id} a={a} color={colorOf(a)} onOpen={onOpen} />
                ))}
                {list.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{list.length - 3} more</span>}
              </div>
              {list.length > 0 && (
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {list.slice(0, 4).map((a) => (
                    <span key={a.id} className="size-1.5 rounded-full" style={{ background: colorOf(a) }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekGrid({
  today,
  selected,
  byDate,
  dentists,
  colorOf,
  onSelect,
  onOpen,
}: {
  today: string
  selected: string
  byDate: Map<string, Appointment[]>
  dentists: Dentist[]
  colorOf: (a: Appointment) => string
  onSelect: (d: string) => void
  onOpen: (id: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(parse(selected)), i))
  const weekAppts = days.flatMap((d) => byDate.get(iso(d)) ?? [])
  // Hours shown: the dentists' working hours plus any booked hour outside them.
  const ranges = dentists.flatMap((d) => d.hours.filter((r): r is [number, number] => !!r))
  const booked = weekAppts.map(slotHour).filter((h): h is number => h !== null)
  const from = Math.min(8, ...ranges.map((r) => r[0]), ...booked)
  const to = Math.max(18, ...ranges.map((r) => r[1]), ...booked.map((h) => h + 1))
  const hours = Array.from({ length: to - from }, (_, i) => from + i)
  const working = (d: Date, h: number) => dentists.some((x) => {
    const r = x.hours[d.getDay()]
    return !!r && h >= r[0] && h < r[1]
  })

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-[64px_repeat(7,minmax(0,1fr))]">
        <div className="border-b bg-muted/40" />
        {days.map((d) => {
          const key = iso(d)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn("border-b border-l bg-muted/40 py-2 text-center text-xs", key === selected && "bg-accent")}
            >
              <div className="text-muted-foreground">{WEEKDAYS[(d.getDay() + 6) % 7]}</div>
              <div className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-medium", key === today && "bg-primary text-primary-foreground")}>
                {d.getDate()}
              </div>
            </button>
          )
        })}

        <div className="border-b px-2 py-1.5 text-right text-[11px] text-muted-foreground">Flexible</div>
        {days.map((d) => (
          <div key={iso(d)} className="grid min-h-9 content-start gap-0.5 border-b border-l p-1">
            {(byDate.get(iso(d)) ?? [])
              .filter((a) => slotHour(a) === null)
              .map((a) => (
                <Chip key={a.id} a={a} color={colorOf(a)} onOpen={onOpen} />
              ))}
          </div>
        ))}

        {hours.map((h) => (
          <div key={h} className="contents">
            <div className="border-b px-2 py-1.5 text-right text-[11px] text-muted-foreground tabular-nums">{hSlot(h).replace(":00", "")}</div>
            {days.map((d) => (
              <div
                key={iso(d) + h}
                className={cn("grid min-h-11 content-start gap-0.5 border-b border-l p-1", !working(d, h) && "bg-muted/50")}
                title={working(d, h) ? undefined : "No dentist in"}
              >
                {(byDate.get(iso(d)) ?? [])
                  .filter((a) => slotHour(a) === h)
                  .map((a) => (
                    <Chip key={a.id} a={a} color={colorOf(a)} onOpen={onOpen} />
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AppointmentRow({ a, color, onOpen }: { a: Appointment; color: string; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(a.id)}
      className={cn("flex w-full items-center gap-3 rounded-md border-l-[3px] bg-muted/40 px-2.5 py-2 text-left hover:bg-muted", a.status === "cancelled" && "opacity-60")}
      style={{ borderLeftColor: color }}
    >
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className={cn("truncate text-sm font-medium", a.status === "cancelled" && "line-through")}>{a.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {timeLabel(a)} · {a.treatment} · {a.dentist}
        </span>
      </div>
      <StatusBadge status={a.status} />
    </button>
  )
}

function DayPanel({
  date,
  today,
  list,
  dentists,
  colorOf,
  onOpen,
}: {
  date: string
  today: string
  list: Appointment[]
  dentists: Dentist[]
  colorOf: (a: Appointment) => string
  onOpen: (id: string) => void
}) {
  const d = parse(date)
  const inClinic = dentists.filter((x) => x.hours[d.getDay()])
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {date === today ? "Today, " : DOW_LONG[d.getDay()] + ", "}
          {MON[d.getMonth()]} {d.getDate()}
        </CardTitle>
        <CardDescription>
          {list.length === 0 ? "No appointments" : `${list.length} appointment${list.length === 1 ? "" : "s"}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">In clinic</span>
          {inClinic.length === 0 ? (
            <span className="text-sm text-muted-foreground">No dentist scheduled</span>
          ) : (
            inClinic.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: dotColor(x.hue) }} />
                  {x.shortName}
                </span>
                <span className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ background: tintColor(x.hue) }}>
                  {hRange(x.hours[d.getDay()])}
                </span>
              </div>
            ))
          )}
        </div>
        {list.length > 0 ? (
          <div className="grid gap-1.5">
            {list.map((a) => (
              <AppointmentRow key={a.id} a={a} color={colorOf(a)} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <div className="grid justify-items-center gap-2 py-4 text-center text-sm text-muted-foreground">
            <CalendarX2 className="size-5" />
            Nothing booked for this day.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Legend({ dentists }: { dentists: Dentist[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
      {dentists.map((d) => (
        <span key={d.id} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: dotColor(d.hue) }} />
          {d.shortName}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: NEUTRAL }} />
        Any available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground">Bold</span> = new request
      </span>
    </div>
  )
}
