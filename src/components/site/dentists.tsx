"use client"

import type { SiteContent } from "@/content/schema"
import { daysText } from "@/lib/schedule"
import { Eyebrow, H2, Photo } from "./primitives"
import { useSiteState } from "./site-state"

export function Dentists({ content, bookableIds }: { content: SiteContent; bookableIds: string[] }) {
  const { dentists, sections } = content
  const { setSchedule, goTo } = useSiteState()

  return (
    <section id="dentists" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-[clamp(28px,4vw,48px)] flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>{sections.dentists.eyebrow}</Eyebrow>
            <H2 text={sections.dentists.title} />
          </div>
          {sections.dentists.intro && (
            <p className="m-0 max-w-[380px] text-[16px] leading-[1.5] text-ink-soft">{sections.dentists.intro}</p>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {dentists.map((d) => (
            <article
              key={d.id}
              className="flex flex-col gap-[18px] rounded-[32px] border border-ink/8 bg-cream p-3 transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(22,22,20,.25)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-stone">
                <Photo src={d.photo} alt={d.name} placeholder="Dentist portrait" />
              </div>
              <div className="flex flex-col gap-2.5 px-2.5 pb-3">
                <div className="font-mono text-[11px] uppercase tracking-[.06em] text-ink-muted">{d.role}</div>
                <h3 className="m-0 font-display text-[28px] leading-none font-bold tracking-[-.02em]">{d.name}</h3>
                <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">{d.bio}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {d.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-ink/14 px-[11px] py-1.5 text-[12px]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2.5 border-t border-ink/10 pt-[14px]">
                  <span className="font-mono text-[12px] text-ink-soft">{daysText(d.hours)}</span>
                  {bookableIds.includes(d.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchedule({ dentist: d.id, day: 0, anchor: 0, monthOff: 0 })
                        goTo("schedule")
                      }}
                      className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper"
                    >
                      See schedule
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
