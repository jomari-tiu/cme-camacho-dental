"use client"

import { useMemo, useSyncExternalStore } from "react"
import { readAccounts } from "@/lib/cms-store"
import { verifyPassword } from "@/lib/password"
import { storage, syncChannel } from "@/lib/storage"

/**
 * DEMO-ONLY auth. There is no backend yet:
 * - the admin login is checked against NEXT_PUBLIC_* env vars (readable in the JS bundle)
 * - dentist accounts live in browser storage with hashed passwords
 * - the session is a localStorage entry
 * Replace with server-side auth (e.g. Auth.js / a backend session) before going live.
 */
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@cmecamacho.ph"
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"
const KEY = "cme-admin-session"
const EVENT = "cme-auth-change"

export type Session =
  | { role: "admin"; email: string; name: string }
  | { role: "dentist"; email: string; name: string; accountId: string; dentistId: string }

export type LoginResult = { ok: true; session: Session } | { ok: false; error: string }

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function store(session: Session) {
  localStorage.setItem(KEY, JSON.stringify({ ...session, at: Date.now() }))
  window.dispatchEvent(new Event(EVENT))
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const e = email.trim().toLowerCase()
  if (e === ADMIN_EMAIL.toLowerCase()) {
    if (password !== ADMIN_PASSWORD) return { ok: false, error: "Incorrect email or password." }
    const session: Session = { role: "admin", email: ADMIN_EMAIL, name: "Clinic admin" }
    store(session)
    return { ok: true, session }
  }

  const accounts = await readAccounts()
  const account = accounts.find((a) => a.email.toLowerCase() === e)
  if (!account || !(await verifyPassword(password, account))) return { ok: false, error: "Incorrect email or password." }
  if (!account.active) return { ok: false, error: "This account is disabled. Please contact the clinic admin." }

  await storage.saveAccounts(accounts.map((a) => (a.id === account.id ? { ...a, lastLoginAt: new Date().toISOString() } : a)))
  const ch = syncChannel()
  ch?.postMessage({ type: "accounts" })
  ch?.close()

  const session: Session = { role: "dentist", email: account.email, name: account.name, accountId: account.id, dentistId: account.dentistId }
  store(session)
  return { ok: true, session }
}

export function logout() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Partial<Session> & { role?: string }
    if (s.role === "dentist" && s.accountId && s.dentistId && s.email) return s as Session
    // sessions from before roles existed were admin sessions
    if ((s.role === "admin" || !s.role) && s.email) return { role: "admin", email: s.email, name: s.name ?? "Clinic admin" }
  } catch {}
  return null
}

/** undefined while rendering on the server / before hydration, then the session or null. */
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => undefined)
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw])
}

/** Paths a dentist account may open; everything else in /admin is admin-only. */
export function dentistCanAccess(pathname: string) {
  return ["/admin/appointments", "/admin/calendar", "/admin/my-profile"].some((p) => pathname.startsWith(p)) || pathname === "/admin"
}
