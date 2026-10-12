import { createStore, get, set, del, type UseStore } from "idb-keyval"
import type { Appointment, DentistAccount, SiteContent } from "@/content/schema"

/**
 * Persistence boundary for the CMS. Everything else talks to this interface,
 * so swapping the browser store for a real API later is a one-file change.
 */
export interface StorageAdapter {
  loadContent(): Promise<SiteContent | null>
  saveContent(content: SiteContent): Promise<void>
  clearContent(): Promise<void>
  loadAppointments(): Promise<Appointment[]>
  saveAppointments(list: Appointment[]): Promise<void>
  loadAccounts(): Promise<DentistAccount[]>
  saveAccounts(list: DentistAccount[]): Promise<void>
}

const CONTENT_KEY = "content"
const APPOINTMENTS_KEY = "appointments"
const ACCOUNTS_KEY = "accounts"

let idb: UseStore | null = null
const db = () => (idb ??= createStore("cme-cms", "kv"))

export const browserStorage: StorageAdapter = {
  async loadContent() {
    return (await get<SiteContent>(CONTENT_KEY, db())) ?? null
  },
  saveContent: (content) => set(CONTENT_KEY, content, db()),
  clearContent: () => del(CONTENT_KEY, db()),
  async loadAppointments() {
    return (await get<Appointment[]>(APPOINTMENTS_KEY, db())) ?? []
  },
  saveAppointments: (list) => set(APPOINTMENTS_KEY, list, db()),
  async loadAccounts() {
    return (await get<DentistAccount[]>(ACCOUNTS_KEY, db())) ?? []
  },
  saveAccounts: (list) => set(ACCOUNTS_KEY, list, db()),
}

export const storage: StorageAdapter = browserStorage

/** Notifies other open tabs (e.g. the public site while editing in /admin). */
export type SyncMessage = { type: "content" } | { type: "appointments" } | { type: "accounts" }

export function syncChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("cme-cms")
}
