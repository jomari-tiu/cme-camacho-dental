"use client"

import { AppointmentCalendar } from "@/components/admin/appointment-calendar"
import { useAdminUser } from "@/components/admin/admin-shell"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"

export default function CalendarPage() {
  const { isAdmin } = useAdminUser()
  return (
    <PageBody wide>
      <PageHeader
        title="Calendar"
        description={
          isAdmin
            ? "Appointment requests by date. Click a request to confirm, reschedule or assign a dentist."
            : "Your appointment requests by date, plus requests with no preferred dentist."
        }
      />
      <AppointmentCalendar />
    </PageBody>
  )
}
