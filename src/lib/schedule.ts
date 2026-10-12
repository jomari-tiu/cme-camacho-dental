import type { HourRange } from "@/content/schema"

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
/** Monday-first week, as getDay() indices. */
export const WEEK = [1, 2, 3, 4, 5, 6, 0]
/** How many days ahead the schedule can be browsed. */
export const MAX_DAYS = 120

export const h12 = (h: number) => (h % 12 || 12) + (h < 12 ? " AM" : " PM")
export const hSlot = (h: number) => (h % 12 || 12) + ":00 " + (h < 12 ? "AM" : "PM")
export const hRange = (r: HourRange) => (r ? h12(r[0]) + "–" + h12(r[1]) : "Off")
export const dotColor = (hue: number) => `oklch(0.62 0.12 ${hue})`
export const tintColor = (hue: number) => `oklch(0.88 0.08 ${hue})`

export const iso = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")

export const dateLabel = (isoDate: string) => {
  const d = new Date(isoDate + "T00:00")
  return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate()
}

/** Deterministic pseudo-random 0–99, used to simulate already-taken slots. */
const hash = (n: number) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  return ((n ^ (n >>> 16)) >>> 0) % 100
}

const strNum = (s: string) => {
  let n = 0
  for (let i = 0; i < s.length; i++) n = (Math.imul(n, 31) + s.charCodeAt(i)) | 0
  return n
}

export const simulatedTaken = (date: Date, dentistId: string, h: number) =>
  hash(Number(iso(date).replace(/-/g, "")) * 10 + strNum(dentistId) * 31 + h) < 32

export const slotKey = (dentistId: string, date: Date | string, h: number) =>
  dentistId + "|" + (typeof date === "string" ? date : iso(date)) + "|" + h

/** "Mon–Fri, Sat" style summary of the days a dentist is in. */
export const daysText = (hours: HourRange[]) => {
  const on = WEEK.map((d) => !!hours[d])
  const runs: string[] = []
  let i = 0
  while (i < 7) {
    if (!on[i]) {
      i++
      continue
    }
    let j = i
    while (j + 1 < 7 && on[j + 1]) j++
    runs.push(j - i >= 2 ? DOW[WEEK[i]] + "–" + DOW[WEEK[j]] : WEEK.slice(i, j + 1).map((d) => DOW[d]).join(", "))
    i = j + 1
  }
  return runs.join(", ") || "By appointment"
}

export const timeOfDayFor = (h: number, times: string[]) => {
  const idx = h < 12 ? 0 : h < 17 ? 1 : 2
  return times[Math.min(idx, times.length - 1)] ?? ""
}
