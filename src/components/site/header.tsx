"use client"

import { useState } from "react"
import type { SiteContent } from "@/content/schema"
import { pillDark } from "./primitives"

export function Header({ content, showBookCta = true }: { content: SiteContent; showBookCta?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { brand, nav } = content

  return (
    <header className="sticky top-0 z-50 px-[clamp(14px,3vw,32px)] py-[14px]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 rounded-full border border-ink/8 bg-paper/78 py-2 pr-2 pl-5 backdrop-blur-[18px]">
        <a href="#" className="flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoNav} alt={brand.name} className="block h-[34px] w-auto" />
        </a>
        <nav className="flex gap-1 text-[14px] font-medium max-[819px]:hidden">
          {nav.links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="rounded-full px-[14px] py-[10px] hover:bg-ink/6 hover:text-teal">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {showBookCta && (
            <a href="#book" className={`${pillDark} whitespace-nowrap px-[18px] py-[11px] text-[14px]`}>
              {nav.ctaLabel}
            </a>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex size-[42px] cursor-pointer flex-col items-center justify-center gap-1 rounded-full border border-ink/14 bg-transparent min-[820px]:hidden"
          >
            <span className="block h-[1.5px] w-4 bg-ink" />
            <span className="block h-[1.5px] w-4 bg-ink" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mx-auto mt-2 grid max-w-[1280px] gap-0.5 rounded-[24px] bg-ink p-2.5 min-[820px]:hidden">
          {nav.links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-[14px] font-display text-[18px] text-paper"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
