import { z } from "zod"
import { PH_MOBILE_RE, normalizePh } from "./phone"

export const required = (label = "This field") => z.string().trim().min(1, `${label} is required.`)

/** "+63 9XX XXX XXXX". Legacy formats are normalised before checking. */
export const phMobile = z.preprocess(
  (v) => (typeof v === "string" ? normalizePh(v) : v),
  z.string().regex(PH_MOBILE_RE, "Enter a valid mobile number: +63 9XX XXX XXXX."),
)

export const email = z.email("Enter a valid email address, e.g. name@example.com.")

export const httpsUrl = z.httpUrl("Enter a full link starting with https://")

/** Links used in buttons/nav: section anchors, site paths, mailto:, tel: or web links. */
export const linkHref = z
  .string()
  .trim()
  .min(1, "Link is required.")
  .refine(
    (v) =>
      /^#[\w-]*$/.test(v) ||
      /^\/[^\s]*$/.test(v) ||
      /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/.test(v) ||
      /^tel:\+?\d[\d\s-]{6,}$/.test(v) ||
      httpsUrl.safeParse(v).success,
    "Use #section, /path, mailto:, tel: or an https:// link.",
  )

/** Image sources: uploaded (data URL), site path or web link. Empty = no image. */
export const imageSrc = z
  .string()
  .refine((v) => v === "" || v.startsWith("/") || /^data:image\//.test(v) || httpsUrl.safeParse(v).success, "Use an uploaded image, /path or https:// link.")

export const requiredImage = imageSrc.refine((v) => v !== "", "An image is required.")

const todayIso = () => {
  const d = new Date()
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
}

/** Public appointment request form. */
export const bookingRequestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80, "Name is too long."),
  phone: z
    .string()
    .min(1, "Please enter your mobile number.")
    .regex(PH_MOBILE_RE, "Please enter a valid mobile number: +63 9XX XXX XXXX."),
  date: z.string().refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayIso()), "Please pick today or a later date."),
  notes: z.string().max(500, "Notes can be up to 500 characters."),
  email: z.union([z.literal(""), z.email("Enter a valid email address, e.g. name@example.com.")]),
  consent: z.boolean(),
})

/** Flattens zod issues into { "a.b.0.c": "message" } (first message per field). */
export function issueMap(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.")

/** Context for uniqueness checks when creating/editing a dentist account. */
export type AccountRules = { takenEmails: string[]; linkedDentistIds: string[]; dentistIds: string[] }

const accountFields = (rules: AccountRules) =>
  z.object({
    name: required("Name"),
    email: email.refine((v) => !rules.takenEmails.includes(v.trim().toLowerCase()), "Another account already uses this email."),
    dentistId: z
      .string()
      .min(1, "Choose the dentist profile this login belongs to.")
      .refine((v) => rules.dentistIds.includes(v), "That dentist profile no longer exists.")
      .refine((v) => !rules.linkedDentistIds.includes(v), "This dentist already has an account."),
  })

const passwordsMatch = (d: { password: string; confirm: string }) => d.password === d.confirm
const mismatch = { path: ["confirm"], message: "Passwords don't match." }

export const createAccountSchema = (rules: AccountRules) =>
  accountFields(rules).extend({ password: passwordSchema, confirm: z.string() }).refine(passwordsMatch, mismatch)
export const editAccountSchema = (rules: AccountRules) => accountFields(rules)
export const resetPasswordSchema = z.object({ password: passwordSchema, confirm: z.string() }).refine(passwordsMatch, mismatch)
