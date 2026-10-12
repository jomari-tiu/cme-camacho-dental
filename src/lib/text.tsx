import { Fragment } from "react"

/** Renders "\n" as <br />. */
export function Lines({ text }: { text: string }) {
  const parts = text.split("\n")
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </>
  )
}

/** Renders [label](url) links inside plain text. */
export function RichText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const out: React.ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const external = /^https?:/.test(m[2])
    out.push(
      <a key={m.index} href={m[2]} className={linkClassName} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {m[1]}
      </a>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

/** "0927 771 5208" → "tel:+639277715208" */
export function telHref(number: string) {
  const digits = number.replace(/\D/g, "")
  return "tel:" + (digits.startsWith("0") ? "+63" + digits.slice(1) : "+" + digits)
}

export const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "")

export const isExternal = (href: string) => /^https?:/.test(href)
