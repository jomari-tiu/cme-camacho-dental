"use client"

import { DentistEditor } from "@/components/admin/dentist-editor"
import { useAdminUser } from "@/components/admin/admin-shell"

export default function MyProfilePage() {
  const { session } = useAdminUser()
  if (session.role !== "dentist") return null
  return <DentistEditor id={session.dentistId} mode="self" />
}
