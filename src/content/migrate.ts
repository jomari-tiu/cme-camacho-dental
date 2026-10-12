import { SECTION_IDS, type SectionRef } from "./schema"

type Raw = Record<string, unknown>

/** Default order = the original design. */
export const defaultLayout = (): SectionRef[] => SECTION_IDS.map((id) => ({ id, visible: true }))

/**
 * Upgrades content saved by older versions of the CMS before it is validated:
 * - adds `layout` (the supplies banner's old `show` flag becomes its visibility)
 * - makes sure every section appears exactly once
 */
export function migrateContent(input: unknown): unknown {
  if (!input || typeof input !== "object") return input
  const raw = { ...(input as Raw) }
  const supplies = raw.supplies as Raw | undefined
  const layout = raw.layout as { sections?: unknown } | undefined

  let sections: SectionRef[] = Array.isArray(layout?.sections)
    ? (layout.sections as SectionRef[]).filter((s) => s && SECTION_IDS.includes(s.id))
    : defaultLayout().map((s) => (s.id === "supplies" && supplies?.show === false ? { ...s, visible: false } : s))

  // de-duplicate, then append any section that is missing
  sections = sections.filter((s, i) => sections.findIndex((x) => x.id === s.id) === i)
  for (const id of SECTION_IDS) if (!sections.some((s) => s.id === id)) sections.push({ id, visible: true })

  raw.layout = { sections: sections.map((s) => ({ id: s.id, visible: s.visible !== false })) }
  return raw
}
