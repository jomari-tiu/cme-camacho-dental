import type { SectionId, SiteContent } from "@/content/schema"

export const SECTION_META: Record<SectionId, { label: string; anchor: string | null; description: string }> = {
  hero: { label: "Hero", anchor: "top", description: "Headline, intro and photo cards" },
  treatments: { label: "Treatments", anchor: "treatments", description: "“What we do” treatment picker" },
  supplies: { label: "Supplies banner", anchor: null, description: "Mint dental-supplies banner" },
  dentists: { label: "Dentists", anchor: "dentists", description: "“The people behind the chair” profiles" },
  schedule: { label: "Schedule", anchor: "schedule", description: "Calendar of open time slots" },
  faq: { label: "FAQs", anchor: "faq", description: "Questions and answers" },
  booking: { label: "Appointment form", anchor: "book", description: "Booking request form" },
  visit: { label: "Visit / map", anchor: "visit", description: "Map and address" },
}

/** Sections that carry an editable heading block (eyebrow / title / intro). */
type CopyKey = "treatments" | "dentists" | "schedule" | "faq" | "booking"
const COPY_KEYS: CopyKey[] = ["treatments", "dentists", "schedule", "faq", "booking"]
const NUMBERED = /^\s*\d{1,2}\s*[—–-]\s*/

/**
 * Keeps "01 — Treatments" style eyebrows in sequence with the current section
 * order. Eyebrows without a leading number are left as written.
 */
export function withSectionNumbers(content: SiteContent): SiteContent {
  const sections = { ...content.sections }
  let n = 0
  for (const s of content.layout.sections) {
    if (!s.visible || !COPY_KEYS.includes(s.id as CopyKey)) continue
    const key = s.id as CopyKey
    const eyebrow = sections[key].eyebrow
    if (!NUMBERED.test(eyebrow)) continue
    n++
    Object.assign(sections, { [key]: { ...sections[key], eyebrow: eyebrow.replace(NUMBERED, String(n).padStart(2, "0") + " — ") } })
  }
  return { ...content, sections }
}

/** "#anchor" links that point at a hidden section. */
export function hiddenAnchors(content: SiteContent): Set<string> {
  return new Set(
    content.layout.sections
      .filter((s) => !s.visible && SECTION_META[s.id].anchor)
      .map((s) => "#" + SECTION_META[s.id].anchor),
  )
}
