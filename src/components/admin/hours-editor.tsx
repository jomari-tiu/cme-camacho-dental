"use client"

import type { HourRange } from "@/content/schema"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DOW_LONG, WEEK, h12 } from "@/lib/schedule"

const hourItems = Array.from({ length: 25 }, (_, h) => ({ value: h, label: h === 24 ? "12 AM (midnight)" : h12(h) }))

function HourSelect({ value, onChange, min, max }: { value: number; onChange: (h: number) => void; min: number; max: number }) {
  const items = hourItems.filter((i) => i.value >= min && i.value <= max)
  return (
    <Select items={items} value={value} onValueChange={(v) => v != null && onChange(v)}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Weekly hours, Monday-first. Slots are hourly from start up to (not including) end. */
export function HoursEditor({ hours, onChange }: { hours: HourRange[]; onChange: (h: HourRange[]) => void }) {
  const setDay = (day: number, r: HourRange) => onChange(hours.map((x, i) => (i === day ? r : x)))
  return (
    <div className="divide-y rounded-lg border">
      {WEEK.map((day) => {
        const r = hours[day]
        return (
          <div key={day} className="flex min-h-12 flex-wrap items-center gap-3 px-3 py-2">
            <Switch checked={!!r} onCheckedChange={(on) => setDay(day, on ? [9, 17] : null)} aria-label={`In on ${DOW_LONG[day]}`} />
            <span className="w-24 text-sm font-medium">{DOW_LONG[day]}</span>
            {r ? (
              <div className="flex items-center gap-2 text-sm">
                <HourSelect value={r[0]} min={0} max={r[1] - 1} onChange={(h) => setDay(day, [h, r[1]])} />
                <span className="text-muted-foreground">to</span>
                <HourSelect value={r[1]} min={r[0] + 1} max={24} onChange={(h) => setDay(day, [r[0], h])} />
                <span className="text-xs text-muted-foreground">{r[1] - r[0]} slots</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Not in</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
