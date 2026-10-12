"use client"

import type { Appointment } from "@/content/schema"
import { ANY_DENTIST } from "@/components/site/site-state"
import { useCms } from "@/lib/cms-store"
import { useAdminUser, type AdminUser } from "./admin-shell"

/** Admins see every request; a dentist sees requests for them plus unassigned ones. */
export function visibleAppointments(list: Appointment[], user: AdminUser): Appointment[] {
  if (user.isAdmin) return list
  const dentist = user.dentist
  if (!dentist) return []
  // Slot keys start with the dentist id, so schedule bookings still match after a rename.
  return list.filter((a) => a.dentist === dentist.shortName || a.slotKey.startsWith(dentist.id + "|") || a.dentist === ANY_DENTIST)
}

export function useVisibleAppointments(): Appointment[] {
  const { appointments } = useCms()
  return visibleAppointments(appointments, useAdminUser())
}
