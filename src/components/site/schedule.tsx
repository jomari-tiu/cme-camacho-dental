"use client"

import { useMemo, useSyncExternalStore } from "react"
import type { Dentist, SiteContent } from "@/content/schema"
import { useCms } from "@/lib/cms-store"
import { cn } from "@/lib/utils"
import {
  DOW,
  DOW_LONG,
  MAX_DAYS,
  MON,
  MONTHS,
  WEEK,
  dotColor,
  hRange,
  hSlot,
  iso,
  simulatedTaken,
  slotKey,
  timeOfDayFor,
  tintColor,
} from "@/lib/schedule"
import { Eyebrow, H2 } from "./primitives"
import { useSiteState } from "./site-state"

const ink = "#161614"

type Cell = {
  key: string
  hidden?: boolean
  date: string
  top: string
  dots: string[]
  out: boolean
  selected: boolean
  closed: boolean
  height: string
  day: number
}

function subscribeMinutes(cb: () => void) {
  const t = setInterval(cb, 15_000)
  return () => clearInterval(t)
}

/** Current time to the minute, only on the client (avoids server/client date mismatches). */
function useNow() {
  const minute = useSyncExternalStore(
    subscribeMinutes,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  )
  return useMemo(() => (minute === null ? null : new Date(minute * 60_000)), [minute])
}

export function Schedule({ content, bookable = true }: { content: SiteContent; bookable?: boolean }) {
  const { sections, dentists, booking } = content
  const { appointments } = useCms()
  const { schedule: s, setSchedule, form, setForm, setSent, goTo } = useSiteState()
  const now = useNow()

  const booked = useMemo(
    () => new Set(appointments.filter((a) => a.status !== "cancelled" && a.slotKey).map((a) => a.slotKey)),
    [appointments],
  )

  const filterValid = s.dentist === "all" || dentists.some((d) => d.id === s.dentist)
  const sDoc = filterValid ? s.dentist : "all"
  const docs = dentists.filter((d) => sDoc === "all" || d.id === sDoc)

  return (
    <section id="schedule" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-[clamp(28px,4vw,40px)] flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>{sections.schedule.eyebrow}</Eyebrow>
            <H2 text={sections.schedule.title} />
          </div>
          {sections.schedule.intro && (
            <p className="m-0 max-w-[380px] text-[16px] leading-[1.5] text-ink-soft">{sections.schedule.intro}</p>
          )}
        </div>

        <div className="flex flex-col gap-[clamp(18px,2.4vw,28px)] rounded-[32px] border border-ink/8 bg-cream p-[clamp(16px,2.6vw,32px)]">
          <div className="flex flex-wrap items-center justify-between gap-[14px]">
            <div className="flex flex-wrap gap-1.5">
              {[{ id: "all", label: "All dentists", dot: ink }, ...dentists.map((d) => ({ id: d.id, label: d.shortName, dot: dotColor(d.hue) }))].map(
                (f) => {
                  const a = f.id === sDoc
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSchedule({ dentist: f.id })}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-[14px] font-medium",
                        a ? "border-ink bg-ink text-paper" : "border-ink/16 bg-transparent text-ink",
                      )}
                    >
                      <span className="size-2 rounded-full" style={{ background: a && f.id === "all" ? "#F3F1EC" : f.dot }} />
                      {f.label}
                    </button>
                  )
                },
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.onlyOpen}
              onClick={() => setSchedule({ onlyOpen: !s.onlyOpen })}
              className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent py-1.5 text-[14px] text-ink"
            >
              <span className={cn("relative h-6 w-10 flex-none rounded-full transition-colors", s.onlyOpen ? "bg-ink" : "bg-ink/18")}>
                <span
                  className="absolute top-[3px] size-[18px] rounded-full bg-cream shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left] duration-200"
                  style={{ left: s.onlyOpen ? 19 : 3 }}
                />
              </span>
              Open times only
            </button>
          </div>

          {now ? (
            <ScheduleBody
              now={now}
              docs={docs}
              booked={booked}
              simulate={booking.simulateBusySlots}
              selectedKey={form.slotKey}
              bookable={bookable}
              onPickSlot={(d, date, h) => {
                setForm((f) => ({
                  ...f,
                  dentist: d.shortName,
                  date: iso(date),
                  slot: hSlot(h),
                  slotKey: slotKey(d.id, date, h),
                  time: timeOfDayFor(h, booking.timesOfDay),
                }))
                setSent(false)
                goTo("book")
              }}
            />
          ) : (
            <div className="min-h-[360px]" />
          )}

          <details className="border-t border-ink/10 pt-[18px]">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
              Regular weekly hours <span className="font-mono text-[12px] font-normal text-ink-muted">show / hide</span>
            </summary>
            <div className="mt-4 overflow-x-auto">
              <div className="flex min-w-[640px] flex-col gap-1">
                <div className="grid grid-cols-[150px_repeat(7,minmax(64px,1fr))] gap-1 font-mono text-[11px] uppercase text-ink-muted">
                  <span />
                  {WEEK.map((d) => (
                    <span key={d} className="px-2 py-1.5">
                      {DOW[d]}
                    </span>
                  ))}
                </div>
                {docs.map((d) => (
                  <div key={d.id} className="grid grid-cols-[150px_repeat(7,minmax(64px,1fr))] items-stretch gap-1">
                    <span className="flex items-center gap-2 text-[14px] font-medium">
                      <span className="size-2 rounded-full" style={{ background: dotColor(d.hue) }} />
                      {d.shortName}
                    </span>
                    {WEEK.map((wd) => {
                      const r = d.hours[wd]
                      return (
                        <span
                          key={wd}
                          className="rounded-[10px] px-2 py-2.5 font-mono text-[12px]"
                          style={{ background: r ? tintColor(d.hue) : "rgba(22,22,20,.04)", color: r ? ink : "#a9a79f" }}
                        >
                          {r ? hRange(r) : "—"}
                        </span>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </details>
          {sections.schedule.note && <p className="m-0 text-[13px] text-ink-muted">{sections.schedule.note}</p>}
        </div>
      </div>
    </section>
  )
}

function ScheduleBody({
  now,
  docs,
  booked,
  simulate,
  selectedKey,
  bookable,
  onPickSlot,
}: {
  now: Date
  docs: Dentist[]
  booked: Set<string>
  simulate: boolean
  selectedKey: string
  bookable: boolean
  onPickSlot: (d: Dentist, date: Date, h: number) => void
}) {
  const { schedule: s, setSchedule } = useSiteState()
  const { day: sDay, view, anchor, monthOff, onlyOpen } = s

  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayAt = (i: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
  const offOf = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - base.getTime()) / 864e5)
  const monthOfDay = (i: number) => {
    const d = dayAt(i)
    return (d.getFullYear() - base.getFullYear()) * 12 + d.getMonth() - base.getMonth()
  }
  const isPast = (i: number, h: number) => i === 0 && h <= now.getHours()
  const isTaken = (dt: Date, d: Dentist, h: number) => booked.has(slotKey(d.id, dt, h)) || (simulate && simulatedTaken(dt, d.id, h))
  const openCount = (i: number, d: Dentist) => {
    if (i < 0) return 0
    const r = d.hours[dayAt(i).getDay()]
    if (!r) return 0
    let n = 0
    for (let h = r[0]; h < r[1]; h++) if (!isPast(i, h) && !isTaken(dayAt(i), d, h)) n++
    return n
  }

  const cellFor = (i: number, height: string): Cell => {
    const dt = dayAt(i)
    const selected = i === sDay
    const out = i < 0 || i > MAX_DAYS
    const dots = out ? [] : docs.filter((d) => openCount(i, d) > 0).map((d) => (selected ? tintColor(d.hue) : dotColor(d.hue)))
    return { key: String(i), date: String(dt.getDate()), top: i === 0 ? "Today" : "", dots, out, selected, closed: dots.length === 0, height, day: i }
  }

  const cells: Cell[] = []
  let label = ""
  let prevDis = false
  let nextDis = false
  let onPrev = () => {}
  let onNext = () => {}

  if (view === "week") {
    const ws = anchor - ((dayAt(anchor).getDay() + 6) % 7)
    for (let k = 0; k < 7; k++) cells.push(cellFor(ws + k, "84px"))
    const a = dayAt(ws)
    const b = dayAt(ws + 6)
    label = MON[a.getMonth()] + " " + a.getDate() + " – " + (a.getMonth() !== b.getMonth() ? MON[b.getMonth()] + " " : "") + b.getDate()
    prevDis = ws <= 0
    nextDis = ws + 7 > MAX_DAYS
    onPrev = () => !prevDis && setSchedule({ anchor: anchor - 7, day: Math.max(0, ws - 7) })
    onNext = () => !nextDis && setSchedule({ anchor: anchor + 7, day: ws + 7 })
  } else {
    const first = new Date(base.getFullYear(), base.getMonth() + monthOff, 1)
    const lead = (first.getDay() + 6) % 7
    const len = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    for (let k = 0; k < lead; k++)
      cells.push({ key: "lead" + k, hidden: true, date: "", top: "", dots: [], out: true, selected: false, closed: true, height: "64px", day: -1 })
    for (let dn = 1; dn <= len; dn++) cells.push(cellFor(offOf(new Date(first.getFullYear(), first.getMonth(), dn)), "64px"))
    label = MONTHS[first.getMonth()] + " " + first.getFullYear()
    prevDis = monthOff <= 0
    nextDis = offOf(new Date(first.getFullYear(), first.getMonth() + 1, 1)) > MAX_DAYS
    const firstOpen = (mo: number) => Math.max(0, offOf(new Date(base.getFullYear(), base.getMonth() + mo, 1)))
    onPrev = () => !prevDis && setSchedule({ monthOff: monthOff - 1, day: firstOpen(monthOff - 1) })
    onNext = () => !nextDis && setSchedule({ monthOff: monthOff + 1, day: firstOpen(monthOff + 1) })
  }

  const sd = dayAt(sDay)
  const dow = sd.getDay()

  const rows = docs.map((d) => {
    const r = d.hours[dow]
    const open = openCount(sDay, d)
    if (!r || open === 0) {
      let nx = -1
      for (let j = sDay + 1; j <= MAX_DAYS; j++)
        if (openCount(j, d) > 0) {
          nx = j
          break
        }
      const nd = nx >= 0 ? dayAt(nx) : null
      return {
        d,
        on: false as const,
        hours: r ? hRange(r) : "Not in",
        offText: r ? (sDay === 0 && now.getHours() >= r[1] - 1 ? "Done for today." : "Fully booked this day.") : "Not in on " + DOW_LONG[dow] + "s.",
        nx,
        nextText: nd ? "Next open: " + DOW[nd.getDay()] + ", " + MON[nd.getMonth()] + " " + nd.getDate() : "",
        open: 0,
      }
    }
    const slots = []
    for (let h = r[0]; h < r[1]; h++) {
      const past = isPast(sDay, h)
      const taken = isTaken(sd, d, h)
      if (onlyOpen && (past || taken)) continue
      slots.push({ h, past, taken, mine: selectedKey === slotKey(d.id, sd, h) })
    }
    return { d, on: true as const, hours: hRange(r) + " · " + open + " open", slots, open }
  })
  const inCount = rows.filter((row) => row.on).length
  const total = rows.reduce((n, row) => n + row.open, 0)

  const navBtn = "size-10 cursor-pointer rounded-full border border-ink/16 bg-transparent text-[16px] text-ink disabled:cursor-default"

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onPrev} disabled={prevDis} aria-label="Previous" className={navBtn} style={{ opacity: prevDis ? 0.3 : 1 }}>
              ←
            </button>
            <span className="min-w-[170px] text-center font-display text-[18px] font-semibold tracking-[-.01em]">{label}</span>
            <button type="button" onClick={onNext} disabled={nextDis} aria-label="Next" className={navBtn} style={{ opacity: nextDis ? 0.3 : 1 }}>
              →
            </button>
            <button
              type="button"
              onClick={() => setSchedule({ day: 0, anchor: 0, monthOff: 0 })}
              className="ml-1 h-10 cursor-pointer rounded-full border border-ink/16 bg-transparent px-4 text-[13px] font-medium text-ink"
            >
              Today
            </button>
          </div>
          <div className="flex gap-0.5 rounded-full bg-ink/6 p-1">
            {(
              [
                ["week", "Week"],
                ["month", "Month"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSchedule(k === "month" ? { view: "month", monthOff: monthOfDay(sDay) } : { view: "week", anchor: sDay })}
                className={cn(
                  "cursor-pointer rounded-full border-0 px-4 py-2 text-[13px] font-medium",
                  view === k ? "bg-ink text-paper" : "bg-transparent text-ink",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((hd) => (
            <span key={hd} className="py-1 text-center font-mono text-[11px] uppercase tracking-[.04em] text-ink-muted">
              {hd}
            </span>
          ))}
          {cells.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={c.out}
              onClick={() => !c.out && setSchedule({ day: c.day })}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[16px] border px-0.5 py-2"
              style={{
                visibility: c.hidden ? "hidden" : "visible",
                minHeight: c.height,
                background: c.selected ? ink : "transparent",
                color: c.selected ? "#F3F1EC" : c.out ? "#c4c2bb" : c.closed ? "#a9a79f" : ink,
                borderColor: c.selected ? ink : c.out ? "transparent" : "rgba(22,22,20,.12)",
                cursor: c.out ? "default" : "pointer",
              }}
            >
              <span className="min-h-3 font-mono text-[10px] uppercase tracking-[.04em] opacity-75">{c.top}</span>
              <span className="font-display text-[clamp(16px,2vw,22px)] leading-none font-semibold">{c.date}</span>
              <span className="flex h-1.5 gap-[3px]">
                {c.dots.map((dot, i) => (
                  <span key={i} className="size-1.5 rounded-full" style={{ background: dot }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/10 pt-[clamp(16px,2vw,24px)]">
        <h3 className="m-0 font-display text-[clamp(22px,2.4vw,30px)] font-bold tracking-[-.02em]">
          {(sDay === 0 ? "Today, " : DOW_LONG[dow] + ", ") + MON[sd.getMonth()] + " " + sd.getDate()}
        </h3>
        <span className="font-mono text-[12px] text-ink-muted">
          {inCount ? inCount + (inCount === 1 ? " dentist" : " dentists") + " in · " + total + " open slots" : "No open slots"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length === 0 && <p className="m-0 text-[14px] text-ink-muted">Online booking isn’t open yet. Call or message us to book a visit.</p>}
        {rows.map((row) => (
          <div
            key={row.d.id}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] items-start gap-x-6 gap-y-[14px] rounded-[22px] bg-paper p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 flex-none items-center justify-center rounded-[12px] font-display text-[15px] font-bold"
                style={{ background: tintColor(row.d.hue) }}
              >
                {row.d.shortName.replace("Dr. ", "")[0]}
              </span>
              <div className="flex flex-col gap-[3px]">
                <span className="text-[16px] font-semibold">{row.d.shortName}</span>
                <span className="text-[13px] text-ink-muted">{row.d.role}</span>
                <span className="mt-0.5 font-mono text-[12px] text-ink">{row.hours}</span>
              </div>
            </div>
            {row.on ? (
              <div className="flex flex-wrap gap-1.5">
                {row.slots.map((sl) => {
                  // Without the booking form, open slots are informational only.
                  const unavailable = sl.past || sl.taken
                  const dis = unavailable || !bookable
                  return (
                    <button
                      key={sl.h}
                      type="button"
                      disabled={dis}
                      title={sl.past ? "Passed" : sl.taken ? "Taken" : bookable ? "Book " + hSlot(sl.h) : "Open"}
                      onClick={() => onPickSlot(row.d, sd, sl.h)}
                      className="min-w-[84px] rounded-[12px] border px-3 py-2.5 font-mono text-[13px]"
                      style={{
                        background: sl.mine ? ink : unavailable ? "rgba(22,22,20,.05)" : "#FBFAF7",
                        color: sl.mine ? "#F3F1EC" : unavailable ? "#a9a79f" : ink,
                        borderColor: sl.mine ? ink : unavailable ? "transparent" : "rgba(22,22,20,.22)",
                        textDecoration: sl.taken && !sl.past ? "line-through" : "none",
                        cursor: unavailable ? "not-allowed" : bookable ? "pointer" : "default",
                      }}
                    >
                      {hSlot(sl.h)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-[42px] flex-wrap items-center gap-3 text-[14px] text-ink-muted">
                <span>{row.offText}</span>
                {row.nx >= 0 && (
                  <button
                    type="button"
                    onClick={() => setSchedule({ day: row.nx, anchor: row.nx, monthOff: monthOfDay(row.nx) })}
                    className="cursor-pointer rounded-full border border-ink/20 bg-transparent px-[14px] py-[9px] text-[13px] text-ink"
                  >
                    {row.nextText} →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
