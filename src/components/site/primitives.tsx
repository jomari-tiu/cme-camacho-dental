import { cn } from "@/lib/utils"
import { Lines } from "@/lib/text"

export const gutter = "px-[clamp(14px,3vw,32px)]"
export const container = "mx-auto max-w-[1280px]"
export const mono = "font-mono"
export const pillDark =
  "rounded-full bg-ink font-semibold text-paper transition-colors hover:bg-ink-hover hover:text-paper"

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-[14px] font-mono text-[12px] uppercase tracking-[.06em] text-ink-muted", className)}>
      {children}
    </div>
  )
}

export function H2({ text, className }: { text: string; className?: string }) {
  return (
    <h2
      className={cn(
        "m-0 font-display text-[clamp(36px,5.4vw,72px)] font-bold leading-[.95] tracking-[-.035em]",
        className,
      )}
    >
      <Lines text={text} />
    </h2>
  )
}

/** Image or a dashed placeholder when the CMS has no image set. */
export function Photo({
  src,
  alt,
  placeholder,
  className,
  fit = "cover",
}: {
  src?: string
  alt: string
  placeholder?: string
  className?: string
  fit?: "cover" | "contain"
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-[12px] uppercase tracking-[.05em] text-ink-muted",
          className,
        )}
      >
        <span className="rounded-full border border-dashed border-ink/25 px-4 py-2">{placeholder ?? "Photo"}</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- CMS images may be data URLs
    <img
      src={src}
      alt={alt}
      className={cn("absolute inset-0 block size-full", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  )
}
