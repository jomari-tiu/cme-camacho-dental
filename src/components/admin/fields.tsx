"use client"

import { useId, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Link2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PhoneInput } from "@/components/phone-input"
import { fileToDataUrl } from "@/lib/image"
import { cn } from "@/lib/utils"

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
  error,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
  htmlFor?: string
  error?: string
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      {children}
      {error ? <FieldMessage>{error}</FieldMessage> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FieldMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  )
}

/** Philippine mobile number with "+63" prefix and "9XX XXX XXXX" mask. */
export function PhoneField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: React.ReactNode
  error?: string
  className?: string
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint ?? "Format: +63 9XX XXX XXXX"} error={error} className={className} htmlFor={id}>
      <PhoneMaskInput id={id} value={value} onChange={onChange} invalid={!!error} />
    </Field>
  )
}

export function PhoneMaskInput({ id, value, onChange, invalid }: { id?: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <PhoneInput
      id={id}
      value={value}
      onChange={onChange}
      aria-invalid={invalid}
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid && "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20",
      )}
      prefixClassName="text-muted-foreground"
      inputClassName="placeholder:text-muted-foreground"
    />
  )
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  multiline,
  rows = 3,
  className,
  type,
  error,
  inputMode,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: React.ReactNode
  placeholder?: string
  multiline?: boolean
  rows?: number
  className?: string
  type?: string
  error?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  disabled?: boolean
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} className={className} htmlFor={id} error={error}>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  )
}

export function ReorderButtons({
  index,
  length,
  onMove,
}: {
  index: number
  length: number
  onMove: (from: number, to: number) => void
}) {
  return (
    <div className="flex">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move down"
        disabled={index === length - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown />
      </Button>
    </div>
  )
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function ConfirmDelete({
  title,
  description,
  onConfirm,
  trigger,
  label,
  confirmLabel = "Delete",
}: {
  title: string
  description?: string
  onConfirm: () => void
  trigger?: React.ReactElement
  label?: React.ReactNode
  confirmLabel?: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          trigger ?? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive hover:text-destructive" />
          )
        }
      >
        {trigger ? (label ?? "Delete") : <Trash2 />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Editable list of short strings (steps, tags, time-of-day options…). */
export function StringListEditor({
  values,
  onChange,
  placeholder,
  addLabel = "Add item",
  errorAt,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  addLabel?: string
  /** Error for the item at an index. */
  errorAt?: (index: number) => string | undefined
}) {
  return (
    <div className="grid gap-2">
      {values.map((v, i) => {
        const error = errorAt?.(i)
        return (
          <div key={i} className="grid gap-1">
            <div className="flex items-center gap-1">
              <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
              <Input
                value={v}
                placeholder={placeholder}
                aria-invalid={!!error}
                onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <ReorderButtons index={i} length={values.length} onMove={(a, b) => onChange(move(values, a, b))} />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange(values.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </div>
            {error && (
              <div className="pl-7">
                <FieldMessage>{error}</FieldMessage>
              </div>
            )}
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => onChange([...values, ""])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  )
}

export function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("")
  const add = () => {
    const t = text.trim()
    if (t && !values.includes(t)) onChange([...values, t])
    setText("")
  }
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5">
      {values.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(values.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        placeholder={placeholder ?? "Type and press Enter"}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            add()
          } else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1))
        }}
        onBlur={add}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}

function useImagePicker(onPick: (dataUrl: string) => void, maxSize?: number) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setBusy(true)
        try {
          onPick(await fileToDataUrl(file, maxSize))
        } catch {
          toast.error("Could not read that image")
        } finally {
          setBusy(false)
        }
      }}
    />
  )
  return { open: () => ref.current?.click(), input, busy }
}

/** Single image: upload (stored as data URL) or paste a URL/path. */
export function ImageField({
  label,
  value,
  onChange,
  hint,
  aspect = "aspect-video",
  dark,
  maxSize,
  fit = "cover",
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: React.ReactNode
  aspect?: string
  dark?: boolean
  maxSize?: number
  fit?: "cover" | "contain"
  error?: string
}) {
  const picker = useImagePicker(onChange, maxSize)
  const [showUrl, setShowUrl] = useState(!!error)
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="grid gap-2">
        <div
          className={cn(
            "relative flex w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border",
            error && "border-destructive",
            aspect,
            dark ? "bg-neutral-900" : "bg-muted",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain p-2")} />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={picker.open} disabled={picker.busy}>
            <ImagePlus /> {picker.busy ? "Processing…" : value ? "Replace" : "Upload"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowUrl((s) => !s)}>
            <Link2 /> URL
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X /> Remove
            </Button>
          )}
        </div>
        {showUrl && (
          <Input
            aria-invalid={!!error}
            value={value.startsWith("data:") ? "" : value}
            placeholder={value.startsWith("data:") ? "Uploaded image — paste a URL to replace" : "https://… or /images/…"}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {picker.input}
      </div>
    </Field>
  )
}

/** Ordered image gallery (treatment results). */
export function ImageListField({
  label,
  values,
  onChange,
  hint,
  error,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  hint?: React.ReactNode
  error?: string
}) {
  const picker = useImagePicker((url) => onChange([...values, url]))
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="flex flex-wrap gap-3">
        {values.map((src, i) => (
          <div key={i} className="group relative w-36 overflow-hidden rounded-lg border bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="aspect-[5/4] w-full object-contain" />
            {i === 0 && <span className="absolute top-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">Cover</span>}
            <div className="flex items-center justify-between bg-background px-1">
              <div className="flex">
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Move left" disabled={i === 0} onClick={() => onChange(move(values, i, i - 1))}>
                  <ArrowUp className="-rotate-90" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Move right"
                  disabled={i === values.length - 1}
                  onClick={() => onChange(move(values, i, i + 1))}
                >
                  <ArrowDown className="-rotate-90" />
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove image" onClick={() => onChange(values.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={picker.open}
          disabled={picker.busy}
          className="flex aspect-[5/4] w-36 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-muted"
        >
          <ImagePlus className="size-5" />
          {picker.busy ? "Processing…" : "Add image"}
        </button>
      </div>
      {picker.input}
    </Field>
  )
}
