"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { defaultContent } from "@/content/defaults"
import { migrateContent } from "@/content/migrate"
import {
  appointmentSchema,
  dentistAccountSchema,
  siteContentSchema,
  storedContentSchema,
  type Appointment,
  type DentistAccount,
  type SiteContent,
} from "@/content/schema"
import { storage, syncChannel, type SyncMessage } from "@/lib/storage"

type CmsContextValue = {
  /** True once stored content has been read (defaults are shown until then). */
  ready: boolean
  content: SiteContent
  saveContent: (next: SiteContent) => Promise<void>
  resetContent: () => Promise<void>
  appointments: Appointment[]
  addAppointment: (a: Omit<Appointment, "id" | "createdAt" | "status">) => Promise<Appointment>
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  replaceAppointments: (list: Appointment[]) => Promise<void>
  accounts: DentistAccount[]
  /** Applies an update to the latest stored accounts list. */
  updateAccounts: (update: (prev: DentistAccount[]) => DentistAccount[]) => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

async function readContent(): Promise<SiteContent> {
  const stored = await storage.loadContent()
  if (!stored) return defaultContent
  const parsed = storedContentSchema.safeParse(migrateContent(stored))
  if (parsed.success) return parsed.data
  console.warn("[cms] stored content is invalid, using defaults", parsed.error)
  return defaultContent
}

async function readAppointments(): Promise<Appointment[]> {
  const list = await storage.loadAppointments()
  return list.flatMap((a) => {
    const parsed = appointmentSchema.safeParse(a)
    return parsed.success ? [parsed.data] : []
  })
}

export async function readAccounts(): Promise<DentistAccount[]> {
  const list = await storage.loadAccounts()
  return list.flatMap((a) => {
    const parsed = dentistAccountSchema.safeParse(a)
    return parsed.success ? [parsed.data] : []
  })
}

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [content, setContent] = useState<SiteContent>(defaultContent)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [accounts, setAccounts] = useState<DentistAccount[]>([])
  const channel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([readContent(), readAppointments(), readAccounts()])
      .then(([c, a, acc]) => {
        if (!alive) return
        setContent(c)
        setAppointments(a)
        setAccounts(acc)
      })
      .catch((err) => console.error("[cms] failed to load", err))
      .finally(() => alive && setReady(true))

    const ch = syncChannel()
    channel.current = ch
    if (ch) {
      ch.onmessage = (e: MessageEvent<SyncMessage>) => {
        if (e.data.type === "content") readContent().then(setContent)
        if (e.data.type === "appointments") readAppointments().then(setAppointments)
        if (e.data.type === "accounts") readAccounts().then(setAccounts)
      }
    }
    return () => {
      alive = false
      ch?.close()
      channel.current = null
    }
  }, [])

  const notify = useCallback((msg: SyncMessage) => channel.current?.postMessage(msg), [])

  const saveContent = useCallback(
    async (next: SiteContent) => {
      const valid = siteContentSchema.parse(next)
      await storage.saveContent(valid)
      setContent(valid)
      notify({ type: "content" })
    },
    [notify],
  )

  const resetContent = useCallback(async () => {
    await storage.clearContent()
    setContent(defaultContent)
    notify({ type: "content" })
  }, [notify])

  const persistAppointments = useCallback(
    async (update: (prev: Appointment[]) => Appointment[]) => {
      // Re-read so writes from another tab (e.g. a booking on the public site) are not lost.
      const next = update(await readAppointments())
      await storage.saveAppointments(next)
      setAppointments(next)
      notify({ type: "appointments" })
    },
    [notify],
  )

  const addAppointment = useCallback<CmsContextValue["addAppointment"]>(
    async (a) => {
      const appt: Appointment = { ...a, id: newId(), createdAt: new Date().toISOString(), status: "new" }
      await persistAppointments((prev) => [appt, ...prev])
      return appt
    },
    [persistAppointments],
  )

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) =>
      persistAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, id } : a))),
    [persistAppointments],
  )

  const deleteAppointment = useCallback(
    (id: string) => persistAppointments((prev) => prev.filter((a) => a.id !== id)),
    [persistAppointments],
  )

  const replaceAppointments = useCallback(
    (list: Appointment[]) => persistAppointments(() => list),
    [persistAppointments],
  )

  const updateAccounts = useCallback(
    async (update: (prev: DentistAccount[]) => DentistAccount[]) => {
      const next = update(await readAccounts()).map((a) => dentistAccountSchema.parse(a))
      await storage.saveAccounts(next)
      setAccounts(next)
      notify({ type: "accounts" })
    },
    [notify],
  )

  const value = useMemo(
    () => ({
      ready,
      content,
      saveContent,
      resetContent,
      appointments,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      replaceAppointments,
      accounts,
      updateAccounts,
    }),
    [
      ready,
      content,
      saveContent,
      resetContent,
      appointments,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      replaceAppointments,
      accounts,
      updateAccounts,
    ],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error("useCms must be used inside <CmsProvider>")
  return ctx
}
