import type { SiteContent } from "@/content/schema"
import { isExternal } from "@/lib/text"
import { pillDark } from "./primitives"

export function SuppliesBand({ content }: { content: SiteContent }) {
  const { supplies } = content
  return (
    <section className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 rounded-[32px] bg-mint p-[clamp(24px,4vw,44px)]">
        <div className="max-w-[640px]">
          <div className="mb-3 font-mono text-[12px] uppercase tracking-[.06em]">{supplies.eyebrow}</div>
          <div className="font-display text-[clamp(22px,2.6vw,32px)] leading-[1.15] font-medium tracking-[-.02em] text-pretty">
            {supplies.text}
          </div>
        </div>
        <a
          href={supplies.ctaHref}
          {...(isExternal(supplies.ctaHref) ? { target: "_blank", rel: "noreferrer" } : {})}
          className={`${pillDark} whitespace-nowrap px-6 py-[15px] text-[14px]`}
        >
          {supplies.ctaLabel}
        </a>
      </div>
    </section>
  )
}
