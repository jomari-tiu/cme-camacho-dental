"use client"

import { useState } from "react"
import type { SiteContent } from "@/content/schema"
import { cn } from "@/lib/utils"
import { Eyebrow, H2, Photo, pillDark } from "./primitives"
import { useSiteState } from "./site-state"

export function Treatments({ content, showBookCta = true }: { content: SiteContent; showBookCta?: boolean }) {
  const { treatments, sections } = content
  const { setForm, setSent, goTo } = useSiteState()
  const defaultIdx = Math.max(0, treatments.findIndex((t) => t.id === content.booking.defaultTreatmentId))
  const [tIdx, setTIdx] = useState(defaultIdx)
  const [imgIdx, setImgIdx] = useState(0)

  if (treatments.length === 0) return null
  const cur = treatments[Math.min(tIdx, treatments.length - 1)]
  const imgs = cur.images
  const img = imgs[Math.min(imgIdx, imgs.length - 1)]

  return (
    <section id="treatments" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-[clamp(28px,4vw,48px)] flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>{sections.treatments.eyebrow}</Eyebrow>
            <H2 text={sections.treatments.title} />
          </div>
          {sections.treatments.intro && (
            <p className="m-0 max-w-[380px] text-[16px] leading-[1.5] text-ink-soft">{sections.treatments.intro}</p>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
          <div className="flex flex-col border-t border-ink/14">
            {treatments.map((t, i) => {
              const active = t.id === cur.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTIdx(i)
                    setImgIdx(0)
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 border-0 border-b border-ink/14 px-4 py-[18px] text-left transition-colors duration-200",
                    active ? "rounded-[16px] bg-ink text-paper" : "bg-transparent text-ink",
                  )}
                >
                  <span className="w-[22px] font-mono text-[12px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-display text-[clamp(19px,2vw,24px)] font-medium tracking-[-.01em]">{t.name}</span>
                  <span className="text-[18px]">{active ? "→" : "+"}</span>
                </button>
              )
            })}
          </div>
          <article className="sticky top-24 flex flex-col gap-6 rounded-[32px] border border-ink/8 bg-cream p-[clamp(20px,3vw,36px)]">
            {imgs.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-ink">
                  <Photo src={img} alt={cur.name + " result"} fit="contain" />
                  <span className="absolute top-3 left-3 rounded-full bg-paper px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[.05em] text-ink">
                    Actual patient result
                  </span>
                </div>
                {imgs.length > 1 && (
                  <div className="flex gap-2">
                    {imgs.map((src, k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setImgIdx(k)}
                        aria-label="Show result"
                        className={cn(
                          "size-16 cursor-pointer overflow-hidden rounded-[12px] border-2 bg-ink p-0",
                          k === imgIdx ? "border-ink opacity-100" : "border-transparent opacity-60",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="block size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-stone">
                <Photo alt="" placeholder={cur.placeholderHint} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-mint px-3 py-[7px] font-mono text-[12px]">{cur.duration}</span>
              <span className="rounded-full border border-ink/16 px-3 py-[7px] font-mono text-[12px]">{cur.visits}</span>
            </div>
            <div>
              <h3 className="m-0 mb-[14px] font-display text-[clamp(28px,3.4vw,42px)] leading-none font-bold tracking-[-.03em]">
                {cur.name}
              </h3>
              <p className="m-0 text-[16px] leading-[1.55] text-pretty text-ink-soft">{cur.description}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
              {cur.steps.map((s, i) => (
                <div key={i} className="border-t border-ink/14 pt-3">
                  <div className="mb-1.5 font-mono text-[11px] text-ink-muted">Step {i + 1}</div>
                  <div className="text-[14px] leading-[1.4]">{s}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="max-w-[280px] text-[14px] text-ink-soft">Good for: {cur.goodFor}</span>
              {showBookCta && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, treatment: cur.name }))
                  setSent(false)
                  goTo("book")
                }}
                className={`${pillDark} cursor-pointer border-0 px-[22px] py-[14px] text-[14px]`}
              >
                Book this →
              </button>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
