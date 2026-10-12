"use client"

import { Fragment, useEffect, useMemo, useRef } from "react"
import type { DentistAccount, SectionId, SiteContent } from "@/content/schema"
import { hiddenAnchors, withSectionNumbers } from "@/lib/layout"
import { useCms } from "@/lib/cms-store"
import { Header } from "./header"
import { Hero } from "./hero"
import { Treatments } from "./treatments"
import { SuppliesBand } from "./supplies-band"
import { Dentists } from "./dentists"
import { Schedule } from "./schedule"
import { Faq } from "./faq"
import { Booking } from "./booking"
import { Visit, Footer } from "./visit-footer"
import { SiteStateProvider, blankForm } from "./site-state"

/** Vertical rhythm from the design: content sections get large gaps, stacked cards sit 16px apart. */
const BIG = "clamp(56px,9vw,120px)"
const CARD_SECTIONS: (SectionId | "footer")[] = ["supplies", "booking", "visit", "footer"]
function gapBetween(prev: SectionId | null, next: SectionId | "footer") {
  if (prev === null) return "clamp(24px,5vw,56px)"
  const nextIsCard = CARD_SECTIONS.includes(next)
  if (prev === "hero") return nextIsCard ? "24px" : `calc(24px + ${BIG})`
  return CARD_SECTIONS.includes(prev) && nextIsCard ? "16px" : BIG
}

/** Dentists who can receive online bookings: those with an active dentist account. */
function bookableContent(content: SiteContent, accounts: DentistAccount[]): SiteContent {
  const active = new Set(accounts.filter((a) => a.active).map((a) => a.dentistId))
  return { ...content, dentists: content.dentists.filter((d) => active.has(d.id)) }
}

function renderSection(id: SectionId, content: SiteContent, booking: SiteContent, showBookCta: boolean) {
  switch (id) {
    case "hero":
      return <Hero content={content} showBookCta={showBookCta} />
    case "treatments":
      return <Treatments key={content.booking.defaultTreatmentId} content={content} showBookCta={showBookCta} />
    case "supplies":
      return <SuppliesBand content={content} />
    case "dentists":
      return <Dentists content={content} bookableIds={booking.dentists.map((d) => d.id)} />
    case "schedule":
      return <Schedule content={booking} bookable={showBookCta} />
    case "faq":
      return <Faq content={content} />
    case "booking":
      return <Booking content={booking} />
    case "visit":
      return <Visit content={content} />
  }
}

/** Port of the design's fade-up-on-scroll effect. Runs once, after stored content is in place. */
function useReveal(root: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const done = useRef(false)
  useEffect(() => {
    const el = root.current
    if (!enabled || done.current || !el) return
    done.current = true
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return

    const els = Array.from(el.querySelectorAll<HTMLElement>("section > div > *, #dentists article, footer > div")).filter(
      (n) => !n.closest("header"),
    )
    const timers: ReturnType<typeof setTimeout>[] = []
    const show = (n: HTMLElement, delay: number) => {
      n.style.transitionDelay = delay + "ms"
      n.classList.add("reveal-in")
      timers.push(
        setTimeout(() => {
          n.classList.remove("reveal-init", "reveal-in")
          n.style.transitionDelay = ""
        }, 900 + delay),
      )
    }
    els.forEach((n) => n.classList.add("reveal-init"))
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, k) => {
            show(e.target as HTMLElement, Math.min(k, 5) * 90)
            io.unobserve(e.target)
          })
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    )
    const vh = window.innerHeight
    let k = 0
    const raf = requestAnimationFrame(() =>
      els.forEach((n) => {
        if (n.getBoundingClientRect().top < vh) show(n, Math.min(k++, 5) * 90)
        else io.observe(n)
      }),
    )
    const revealAll = () => {
      els.forEach((n) => n.classList.contains("reveal-init") && show(n, 0))
      io.disconnect()
    }
    window.addEventListener("beforeprint", revealAll)
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      io.disconnect()
      window.removeEventListener("beforeprint", revealAll)
    }
  }, [root, enabled])
}

export function SitePage() {
  const { content: stored, ready, accounts } = useCms()
  // Number section eyebrows in display order and drop menu links to hidden sections.
  const content = useMemo(() => {
    const numbered = withSectionNumbers(stored)
    const hidden = hiddenAnchors(stored)
    return { ...numbered, nav: { ...numbered.nav, links: numbered.nav.links.filter((l) => !hidden.has(l.href)) } }
  }, [stored])
  const booking = useMemo(() => bookableContent(content, accounts), [content, accounts])
  const visible = content.layout.sections.filter((s) => s.visible).map((s) => s.id)
  const showBookCta = visible.includes("booking")
  const root = useRef<HTMLDivElement>(null)
  useReveal(root, ready)

  useEffect(() => {
    if (ready) document.title = content.seo.title
  }, [ready, content.seo.title])

  const defaultTreatment =
    content.treatments.find((t) => t.id === content.booking.defaultTreatmentId)?.name ?? content.treatments[0]?.name ?? ""

  return (
    <div ref={root} className="site min-h-screen bg-paper text-ink" data-ready={ready}>
      <noscript>
        <style>{`.site[data-ready="false"]{opacity:1}`}</style>
      </noscript>
      {/* Remount once stored content arrives so per-section state starts from the saved defaults. */}
      <SiteStateProvider key={String(ready)} initialForm={blankForm(defaultTreatment, content.booking.timesOfDay[0] ?? "")}>
        <Header content={content} showBookCta={showBookCta} />
        {visible.map((id, i) => (
          <Fragment key={id}>
            <div aria-hidden style={{ height: gapBetween(i === 0 ? null : visible[i - 1], id) }} />
            {renderSection(id, content, booking, showBookCta)}
          </Fragment>
        ))}
        <div aria-hidden style={{ height: gapBetween(visible.at(-1) ?? null, "footer") }} />
        <Footer content={content} />
      </SiteStateProvider>
    </div>
  )
}
