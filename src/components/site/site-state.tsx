"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type BookingForm = {
  name: string
  phone: string
  treatment: string
  dentist: string
  date: string
  time: string
  notes: string
  email: string
  /** Agreed to receive appointment updates by SMS/email. */
  consent: boolean
  slot: string
  slotKey: string
}

export type ScheduleState = {
  /** "all" or a dentist id */
  dentist: string
  /** Selected day as an offset from today. */
  day: number
  view: "week" | "month"
  /** Day offset the week view is anchored to. */
  anchor: number
  /** Month offset for the month view. */
  monthOff: number
  onlyOpen: boolean
}

export const ANY_DENTIST = "Any available"

export const blankForm = (treatment: string, time: string): BookingForm => ({
  name: "",
  phone: "",
  treatment,
  dentist: ANY_DENTIST,
  date: "",
  time,
  notes: "",
  email: "",
  consent: false,
  slot: "",
  slotKey: "",
})

type SiteStateValue = {
  form: BookingForm
  setForm: (update: (f: BookingForm) => BookingForm) => void
  sent: boolean
  setSent: (v: boolean) => void
  schedule: ScheduleState
  setSchedule: (patch: Partial<ScheduleState>) => void
  goTo: (id: string) => void
}

const SiteStateContext = createContext<SiteStateValue | null>(null)

export function SiteStateProvider({ initialForm, children }: { initialForm: BookingForm; children: React.ReactNode }) {
  const [form, setFormState] = useState(initialForm)
  const [sent, setSent] = useState(false)
  const [schedule, setScheduleState] = useState<ScheduleState>({
    dentist: "all",
    day: 0,
    view: "week",
    anchor: 0,
    monthOff: 0,
    onlyOpen: false,
  })

  const setForm = useCallback((update: (f: BookingForm) => BookingForm) => setFormState(update), [])
  const setSchedule = useCallback((patch: Partial<ScheduleState>) => setScheduleState((s) => ({ ...s, ...patch })), [])
  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" })
  }, [])

  const value = useMemo(
    () => ({ form, setForm, sent, setSent, schedule, setSchedule, goTo }),
    [form, setForm, sent, schedule, setSchedule, goTo],
  )
  return <SiteStateContext.Provider value={value}>{children}</SiteStateContext.Provider>
}

export function useSiteState() {
  const ctx = useContext(SiteStateContext)
  if (!ctx) throw new Error("useSiteState must be used inside <SiteStateProvider>")
  return ctx
}
