"use client"

import { useState } from "react"
import type { SiteContent } from "@/content/schema"
import { RichText } from "@/lib/text"
import { cn } from "@/lib/utils"
import { Eyebrow, H2 } from "./primitives"

export function Faq({ content }: { content: SiteContent }) {
  const { faqs, sections } = content
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-[clamp(24px,4vw,64px)]">
        <div>
          <Eyebrow>{sections.faq.eyebrow}</Eyebrow>
          <H2 text={sections.faq.title} className="mb-5" />
          <p className="m-0 max-w-[340px] leading-[1.5] text-ink-soft">
            <RichText text={sections.faq.intro} linkClassName="underline underline-offset-[3px] hover:text-teal" />
          </p>
        </div>
        <div className="flex flex-col border-t border-ink/14">
          {faqs.map((f, i) => {
            const o = i === open
            return (
              <div key={f.id} className="border-b border-ink/14">
                <button
                  type="button"
                  onClick={() => setOpen(o ? -1 : i)}
                  aria-expanded={o}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-[22px] text-left text-ink"
                >
                  <span className="font-display text-[clamp(18px,1.8vw,22px)] font-medium tracking-[-.01em]">{f.question}</span>
                  <span
                    className={cn(
                      "flex size-[34px] flex-none items-center justify-center rounded-full text-[18px]",
                      o ? "bg-ink text-paper" : "bg-transparent text-ink",
                    )}
                  >
                    {o ? "−" : "+"}
                  </span>
                </button>
                {o && <p className="m-0 mb-[22px] max-w-[620px] text-[16px] leading-[1.55] text-pretty text-ink-soft">{f.answer}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
