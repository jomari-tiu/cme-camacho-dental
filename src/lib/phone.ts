/** Philippine mobile numbers are stored as "+63 9XX XXX XXXX". */
export const PH_PREFIX = "+63"
export const PH_MOBILE_RE = /^\+63 9\d{2} \d{3} \d{4}$/
export const PH_LOCAL_PLACEHOLDER = "9XX XXX XXXX"

/**
 * The 10 local digits from any typed/pasted/legacy value:
 * "0917 123 4567", "+63 917 123 4567", "639171234567" → "9171234567".
 */
export function phDigits(value: string): string {
  let d = value.replace(/\D/g, "")
  if (d.length > 10 && d.startsWith("63")) d = d.slice(2)
  if (d.startsWith("0")) d = d.slice(1)
  return d.slice(0, 10)
}

/** Local digits currently held in a stored value (which may be partial while typing). */
export function localDigits(value: string): string {
  return value.trim().startsWith(PH_PREFIX) ? value.trim().slice(PH_PREFIX.length).replace(/\D/g, "").slice(0, 10) : phDigits(value)
}

/** "9171234" → "917 123 4" (no trailing separators, so backspace works naturally). */
export const groupDigits = (d: string) => [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(" ")

/** Local digits → stored value ("" when empty). */
export const toStored = (d: string) => (d ? `${PH_PREFIX} ${groupDigits(d)}` : "")

/** Best-effort conversion of legacy values (e.g. "(0927) 771-5208") to the stored format. */
export function normalizePh(value: string): string {
  const d = phDigits(value)
  return d.length === 10 ? toStored(d) : value
}
