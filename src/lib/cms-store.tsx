"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { defaultContent } from "@/content/defaults"
import { migrateContent } from "@/content/migrate"
import {
  appointmentSchema,
  dentistAccountSchema,
  notificationConfigSchema,
  outboxMessageSchema,
  siteContentSchema,
  storedContentSchema,
  type Appointment,
  type DentistAccount,
  type NotificationConfig,
  type NotificationEvent,
  type OutboxMessage,
  type SiteContent,
} from "@/content/schema"
import { buildMessages, deliver, eventForChange, summarize, type NotifyResult } from "@/lib/notifications/dispatch"
import { defaultNotificationConfig, withAllTemplates } from "@/lib/notifications/templates"
import { storage, syncChannel, type SyncMessage } from "@/lib/storage"

type CmsContextValue = {
  /** True once stored content has been read (defaults are shown until then). */
  ready: boolean
  content: SiteContent
  saveContent: (next: SiteContent) => Promise<void>
  resetContent: () => Promise<void>
  appointments: Appointment[]
  addAppointment: (a: Omit<Appointment, "id" | "createdAt" | "status">) => Promise<Appointment>
  /** Resolves to what was sent to the patient, if the change triggers a notification. */
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<NotifyResult | null>
  deleteAppointment: (id: string) => Promise<void>
  replaceAppointments: (list: Appointment[]) => Promise<void>
  accounts: DentistAccount[]
  /** Applies an update to the latest stored accounts list. */
  updateAccounts: (update: (prev: DentistAccount[]) => DentistAccount[]) => Promise<void>
  notificationConfig: NotificationConfig
  saveNotificationConfig: (config: NotificationConfig) => Promise<void>
  outbox: OutboxMessage[]
  updateOutbox: (update: (prev: OutboxMessage[]) => OutboxMessage[]) => Promise<void>
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

export async function readNotificationConfig(): Promise<NotificationConfig> {
  const parsed = notificationConfigSchema.safeParse(await storage.loadNotificationConfig())
  return withAllTemplates(parsed.success ? parsed.data : defaultNotificationConfig())
}

async function readOutbox(): Promise<OutboxMessage[]> {
  return (await storage.loadOutbox()).flatMap((m) => {
    const parsed = outboxMessageSchema.safeParse(m)
    return parsed.success ? [parsed.data] : []
  })
}

/** Keep the outbox from growing forever in browser storage. */
const OUTBOX_LIMIT = 500

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [content, setContent] = useState<SiteContent>(defaultContent)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [accounts, setAccounts] = useState<DentistAccount[]>([])
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(() => defaultNotificationConfig())
  const [outbox, setOutbox] = useState<OutboxMessage[]>([])
  // Latest content for rendering messages, without re-creating every callback on each edit.
  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])
  const channel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([readContent(), readAppointments(), readAccounts(), readNotificationConfig(), readOutbox()])
      .then(([c, a, acc, nc, ob]) => {
        if (!alive) return
        setContent(c)
        setAppointments(a)
        setAccounts(acc)
        setNotificationConfig(nc)
        setOutbox(ob)
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
        if (e.data.type === "notifications") readNotificationConfig().then(setNotificationConfig)
        if (e.data.type === "outbox") readOutbox().then(setOutbox)
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

  const updateOutbox = useCallback(
    async (update: (prev: OutboxMessage[]) => OutboxMessage[]) => {
      const next = update(await readOutbox()).slice(0, OUTBOX_LIMIT)
      await storage.saveOutbox(next)
      setOutbox(next)
      notify({ type: "outbox" })
    },
    [notify],
  )

  /** Renders the event's templates for this appointment, hands them to the transport and logs them. */
  const sendNotifications = useCallback(
    async (event: NotificationEvent, appt: Appointment): Promise<NotifyResult> => {
      try {
        const config = await readNotificationConfig()
        const messages = await deliver(buildMessages(event, appt, contentRef.current, config))
        if (messages.length) await updateOutbox((prev) => [...messages, ...prev])
        return summarize(messages)
      } catch (err) {
        console.error("[notifications] failed", err)
        return { queued: 0, sent: 0, skipped: 0, failed: 1 }
      }
    },
    [updateOutbox],
  )

  const addAppointment = useCallback<CmsContextValue["addAppointment"]>(
    async (a) => {
      const appt: Appointment = { ...a, id: newId(), createdAt: new Date().toISOString(), status: "new" }
      await persistAppointments((prev) => [appt, ...prev])
      await sendNotifications("request_received", appt)
      return appt
    },
    [persistAppointments, sendNotifications],
  )

  const updateAppointment = useCallback(
    async (id: string, patch: Partial<Appointment>) => {
      let before: Appointment | undefined
      let after: Appointment | undefined
      await persistAppointments((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a
          before = a
          after = { ...a, ...patch, id }
          return after
        }),
      )
      const event = before && after ? eventForChange(before, after) : null
      return event && after ? sendNotifications(event, after) : null
    },
    [persistAppointments, sendNotifications],
  )

  const saveNotificationConfig = useCallback(
    async (config: NotificationConfig) => {
      const valid = notificationConfigSchema.parse(config)
      await storage.saveNotificationConfig(valid)
      setNotificationConfig(valid)
      notify({ type: "notifications" })
    },
    [notify],
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
      notificationConfig,
      saveNotificationConfig,
      outbox,
      updateOutbox,
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
      notificationConfig,
      saveNotificationConfig,
      outbox,
      updateOutbox,
    ],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error("useCms must be used inside <CmsProvider>")
  return ctx
}
