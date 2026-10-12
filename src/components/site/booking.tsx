"use client"

import { useState, useSyncExternalStore } from "react"
import type { SiteContent } from "@/content/schema"
import { useCms } from "@/lib/cms-store"
import { dateLabel } from "@/lib/schedule"
import { H2 } from "./primitives"
import { fill, telHref } from "@/lib/text"
import { ANY_DENTIST, blankForm, useSiteState, type BookingForm } from "./site-state"
import { PhoneInput } from "@/components/phone-input"
import { iso } from "@/lib/schedule"
import { bookingRequestSchema, issueMap } from "@/lib/validation"

const field =
  "rounded-[16px] border border-paper/12 bg-ink-2 px-4 py-[15px] text-[16px] text-paper outline-none focus:border-mint placeholder:text-ink-dim"
const labelCls = "flex flex-col gap-2 text-[13px] text-ink-faint"
const invalid = "!border-error-soft"

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-[13px] text-error-soft">{message}</span> : null
}

const noop = () => () => {}

const validate = (f: BookingForm) => {
  const parsed = bookingRequestSchema.safeParse(f)
  return parsed.success ? {} : issueMap(parsed.error)
}

export function Booking({ content }: { content: SiteContent }) {
  const { sections, contact, treatments, dentists, booking } = content
  const copy = sections.booking
  const { addAppointment } = useCms()
  const { form, setForm, sent, setSent } = useSiteState()
  const [err, setErr] = useState("")
  const [submitting, setSubmitting] = useState(false)
  // Field errors appear after the first submit attempt, then update as the patient types.
  const [showErrors, setShowErrors] = useState(false)
  const errors: Record<string, string> = showErrors ? validate(form) : {}
  // Client-only so the server's timezone can't disagree with the visitor's "today".
  const today = useSyncExternalStore(noop, () => iso(new Date()), () => "")

  const update = (next: (f: BookingForm) => BookingForm) => {
    setForm(next)
    setErr("")
  }
  const set = (k: keyof BookingForm, clearSlot = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value
    update((f) => ({ ...f, [k]: v, ...(clearSlot ? { slot: "", slotKey: "" } : {}) }))
  }

  const whenLabel = form.slot
    ? dateLabel(form.date) + " · " + form.slot
    : (form.date
        ? new Date(form.date + "T00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })
        : "Any day") +
      " · " +
      form.time

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (Object.keys(validate(form)).length) return
    setSubmitting(true)
    try {
      await addAppointment({ ...form, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase() })
      setSent(true)
      setErr("")
    } catch {
      setErr("Could not send your request. Please call or message us instead.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="book" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(32px,5vw,72px)] rounded-[clamp(28px,3vw,40px)] bg-ink p-[clamp(24px,5vw,64px)] text-paper">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <div className="mb-[14px] font-mono text-[12px] uppercase tracking-[.06em] text-mint">{copy.eyebrow}</div>
            <H2 text={copy.title} className="mb-5" />
            <p className="m-0 max-w-[400px] leading-[1.55] text-ink-faint">{copy.intro}</p>
          </div>
          <div className="grid gap-[14px] text-[15px]">
            {contact.phones.map((p) => (
              <a key={p.label + p.number} href={telHref(p.number)} className="flex justify-between border-t border-paper/16 pt-[14px] text-paper">
                <span className="text-ink-dim">{p.label}</span>
                <span className="font-mono">{p.number}</span>
              </a>
            ))}
            <a href={"mailto:" + contact.email} className="flex justify-between border-t border-paper/16 pt-[14px] text-paper">
              <span className="text-ink-dim">Email</span>
              <span className="font-mono">{contact.email}</span>
            </a>
          </div>
        </div>

        {!sent ? (
          <form onSubmit={submit} noValidate className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] content-start gap-3">
            <label className={labelCls}>
              Full name
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                aria-invalid={!!errors.name}
                className={`${field} ${errors.name ? invalid : ""}`}
              />
              <FieldError message={errors.name} />
            </label>
            <label className={labelCls}>
              Mobile number
              <PhoneInput
                value={form.phone}
                onChange={(phone) => update((f) => ({ ...f, phone }))}
                aria-invalid={!!errors.phone}
                className={`${field} focus-within:border-mint ${errors.phone ? invalid : ""}`}
                prefixClassName="font-mono text-ink-faint"
                inputClassName="text-paper placeholder:text-ink-dim"
              />
              <FieldError message={errors.phone} />
            </label>
            <label className={labelCls}>
              Treatment
              <select value={form.treatment} onChange={set("treatment")} className={`${field} appearance-none`}>
                {treatments.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </label>
            <label className={labelCls}>
              Dentist
              <select value={form.dentist} onChange={set("dentist", true)} className={`${field} appearance-none`}>
                <option value={ANY_DENTIST}>{ANY_DENTIST}</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.shortName}>
                    {d.shortName}
                  </option>
                ))}
              </select>
            </label>
            {form.slot ? (
              <div className="col-span-full flex items-center justify-between gap-3 rounded-[16px] bg-mint py-3 pr-3 pl-4 text-ink">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-[.05em]">Selected time</span>
                  <span className="text-[15px] font-semibold">{dateLabel(form.date) + " · " + form.slot + " · " + form.dentist}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, slot: "", slotKey: "" }))}
                  className="cursor-pointer rounded-full border border-ink/25 bg-transparent px-[14px] py-2 text-[13px] text-ink"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <label className={labelCls}>
                  Preferred date
                  <input
                    type="date"
                    value={form.date}
                    min={today || undefined}
                    onChange={set("date", true)}
                    aria-invalid={!!errors.date}
                    className={`${field} py-[14px] [color-scheme:dark] ${errors.date ? invalid : ""}`}
                  />
                  <FieldError message={errors.date} />
                </label>
                <div className={labelCls}>
                  Time of day
                  <div className="flex gap-1.5 rounded-[16px] border border-paper/12 bg-ink-2 p-[5px]">
                    {booking.timesOfDay.map((tm) => (
                      <button
                        key={tm}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, time: tm }))}
                        className="flex-1 cursor-pointer rounded-[12px] border-0 px-1 py-2.5 text-[14px]"
                        style={{ background: form.time === tm ? "oklch(0.88 0.08 175)" : "transparent", color: form.time === tm ? "#161614" : "#b9b7af" }}
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <label className={`${labelCls} col-span-full`}>
              Email (optional)
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                placeholder="juan@example.com"
                aria-invalid={!!errors.email}
                className={`${field} ${errors.email ? invalid : ""}`}
              />
              <FieldError message={errors.email} />
            </label>
            <label className={`${labelCls} col-span-full`}>
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder="Tooth pain, first visit, bringing a child…"
                maxLength={500}
                aria-invalid={!!errors.notes}
                className={`${field} resize-y ${errors.notes ? invalid : ""}`}
              />
              <FieldError message={errors.notes} />
            </label>
            <label className="col-span-full flex cursor-pointer items-start gap-3 text-[14px] leading-[1.45] text-ink-faint">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update((f) => ({ ...f, consent: e.target.checked }))}
                className="mt-0.5 size-[18px] flex-none cursor-pointer accent-[oklch(0.88_0.08_175)]"
              />
              <span>
                Send me appointment updates by SMS{form.email ? " and email" : ""} (confirmation, changes and reminders). You can reply STOP anytime.
              </span>
            </label>
            {err && <div className="col-span-full text-[14px] text-error-soft">{err}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="col-span-full mt-1.5 cursor-pointer rounded-full border-0 bg-mint p-[18px] text-[16px] font-semibold text-ink transition-colors hover:bg-mint-hover disabled:opacity-60"
            >
              {submitting ? "Sending…" : copy.submitLabel}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5 self-start rounded-[28px] bg-ink-2 p-[clamp(24px,3vw,36px)]">
            <div className="flex size-[52px] items-center justify-center rounded-full bg-mint text-[24px] text-ink">✓</div>
            <div className="font-display text-[clamp(26px,3vw,36px)] leading-[1.05] font-bold tracking-[-.02em]">
              {fill(copy.successTitle, { firstName: form.name.trim().split(" ")[0], phone: form.phone })}
            </div>
            <p className="m-0 leading-[1.55] text-ink-faint">
              {fill(copy.successText, { firstName: form.name.trim().split(" ")[0], phone: form.phone })}
            </p>
            <div className="grid gap-2.5 text-[14px]">
              {[
                ["Treatment", form.treatment],
                ["Preferred", whenLabel],
                ["Dentist", form.dentist],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-t border-paper/12 pt-2.5">
                  <span className="text-ink-dim">{k}</span>
                  <span className="text-right">{v}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setShowErrors(false)
                setForm(() => blankForm(treatments[0]?.name ?? "", booking.timesOfDay[0] ?? ""))
              }}
              className="cursor-pointer self-start rounded-full border border-paper/24 bg-transparent px-[18px] py-3 text-[14px] text-paper"
            >
              New request
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
