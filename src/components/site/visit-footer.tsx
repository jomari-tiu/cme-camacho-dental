import type { SiteContent } from "@/content/schema"
import { isExternal } from "@/lib/text"

export function Visit({ content }: { content: SiteContent }) {
  const { contact, sections } = content
  return (
    <section id="visit" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap gap-4">
        <div className="min-h-[300px] min-w-0 flex-[2_1_420px] overflow-hidden rounded-[32px] bg-stone">
          <iframe title="Map" src={contact.mapEmbedUrl} loading="lazy" className="block size-full min-h-[300px] border-0" />
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col justify-between gap-6 rounded-[32px] border border-ink/8 bg-cream p-7">
          <div>
            <div className="mb-[14px] font-mono text-[12px] uppercase tracking-[.06em] text-ink-muted">{sections.visit.label}</div>
            <div className="font-display text-[24px] leading-[1.2] tracking-[-.01em]">{contact.address}</div>
          </div>
          <a
            href={contact.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex justify-between border-t border-ink/14 pt-[14px] text-[15px] font-semibold hover:text-teal"
          >
            {sections.visit.directionsLabel} <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer({ content }: { content: SiteContent }) {
  const { brand, footer } = content
  return (
    <footer className="px-[clamp(14px,3vw,32px)] pb-4">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-9 rounded-[32px] bg-ink p-[clamp(24px,4vw,44px)] text-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logoFooter} alt={brand.name} className="block h-auto w-[min(100%,560px)]" />
        <div className="flex flex-wrap justify-between gap-4 border-t border-paper/14 pt-5 text-[14px] text-ink-dim">
          <span>{footer.copyright}</span>
          <div className="flex flex-wrap gap-5">
            {footer.links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                {...(isExternal(l.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="text-paper hover:text-mint"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
