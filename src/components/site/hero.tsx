import type { SiteContent } from "@/content/schema"
import { Lines, telHref } from "@/lib/text"
import { Photo, pillDark } from "./primitives"

export function Hero({ content, showBookCta = true }: { content: SiteContent; showBookCta?: boolean }) {
  const { hero, brand, contact } = content
  return (
    <section id="top" className="px-[clamp(14px,3vw,32px)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <div className="flex flex-col justify-between gap-10 py-[clamp(8px,2vw,24px)]">
          <div className="flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[.06em]">
            <span className="size-2 rounded-full bg-mint-dot [animation:cmepulse_2s_ease-in-out_infinite]" />
            <span>{hero.badge}</span>
          </div>
          <h1 className="m-0 font-display text-[clamp(48px,8.4vw,116px)] leading-[.92] font-bold tracking-[-.04em] text-balance">
            <Lines text={hero.headline} />
          </h1>
          <div className="flex max-w-[480px] flex-col gap-6">
            <p className="m-0 text-[clamp(16px,1.5vw,19px)] leading-[1.5] text-pretty text-ink-soft">{hero.subtext}</p>
            <div className="flex flex-wrap gap-2.5">
              {showBookCta && (
                <a href="#book" className={`${pillDark} px-[26px] py-4 text-[15px]`}>
                  {hero.primaryCtaLabel}
                </a>
              )}
              <a
                href={telHref(contact.primaryPhone)}
                className="rounded-full border border-ink/20 px-[22px] py-4 font-mono text-[15px] font-medium transition-colors hover:bg-ink hover:text-paper"
              >
                {contact.primaryPhone}
              </a>
            </div>
          </div>
        </div>
        <div className="grid min-h-[clamp(440px,52vw,620px)] grid-cols-2 grid-rows-[minmax(260px,1.4fr)_minmax(150px,1fr)] gap-3">
          <div className="relative col-span-2 overflow-hidden rounded-[28px] bg-stone">
            <Photo src={hero.image} alt={brand.name} placeholder="Clinic / patient photo" />
          </div>
          <div className="flex flex-col justify-between overflow-hidden rounded-[28px] bg-ink p-5 text-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoMark} alt="" className="block h-auto w-[clamp(56px,7vw,84px)]" />
            <div className="font-display text-[clamp(18px,1.8vw,22px)] leading-[1.15] tracking-[-.01em]">{hero.darkCardText}</div>
          </div>
          <div className="flex flex-col justify-between rounded-[28px] bg-mint p-5">
            <div className="font-mono text-[11px] uppercase tracking-[.06em]">{hero.mintCardLabel}</div>
            <a
              href={contact.messengerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-end justify-between gap-2 font-display text-[clamp(18px,1.8vw,22px)] leading-[1.15] hover:text-teal"
            >
              {hero.mintCardLinkText} <span className="text-[26px] leading-none">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
