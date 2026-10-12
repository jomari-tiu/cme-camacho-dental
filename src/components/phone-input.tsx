"use client"

import { useRef } from "react"
import { PH_LOCAL_PLACEHOLDER, PH_PREFIX, groupDigits, localDigits, phDigits, toStored } from "@/lib/phone"
import { cn } from "@/lib/utils"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  /** Stored value, "+63 9XX XXX XXXX" (or partial while typing, or ""). */
  value: string
  onChange: (value: string) => void
  /** Classes for the wrapper that looks like the text field. */
  className?: string
  prefixClassName?: string
  inputClassName?: string
}

/**
 * Philippine mobile number input with a fixed "+63" prefix and a
 * "9XX XXX XXXX" mask. Accepts pasted numbers in any common format.
 */
export function PhoneInput({ value, onChange, className, prefixClassName, inputClassName, placeholder, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const caret = e.target.selectionStart ?? raw.length
    // Count digits before the caret so it lands in the same spot after re-formatting.
    const digitsBefore = phDigits(raw.slice(0, caret)).length
    const digits = phDigits(raw)
    onChange(toStored(digits))

    requestAnimationFrame(() => {
      const el = ref.current
      if (!el || document.activeElement !== el) return
      const shown = el.value
      let pos = 0
      for (let seen = 0; pos < shown.length && seen < digitsBefore; pos++) if (/\d/.test(shown[pos])) seen++
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className={cn("flex items-center", className)}>
      <span aria-hidden className={cn("pr-2 select-none", prefixClassName)}>
        {PH_PREFIX}
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder ?? PH_LOCAL_PLACEHOLDER}
        value={groupDigits(localDigits(value))}
        onChange={handleChange}
        className={cn("min-w-0 flex-1 bg-transparent outline-none", inputClassName)}
        {...rest}
      />
    </div>
  )
}
