"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck, CalendarClock, Clock, HelpCircle, Stethoscope, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { StatusBadge, preferredLabel, receivedLabel } from "@/components/admin/appointment-utils"
import { useCms } from "@/lib/cms-store"
import { useAdminUser } from "@/components/admin/admin-shell"
import { useVisibleAppointments } from "@/components/admin/use-visible-appointments"
import { daysText } from "@/lib/schedule"
import { AppointmentCalendar } from "@/components/admin/appointment-calendar"

export default function DashboardPage() {
  const { content } = useCms()
  const { isAdmin, dentist } = useAdminUser()
  const appointments = useVisibleAppointments()
  const newCount = appointments.filter((a) => a.status === "new").length
  const stats = isAdmin
    ? [
        { label: "New requests", value: newCount, icon: CalendarClock, href: "/admin/appointments" },
        { label: "Treatments", value: content.treatments.length, icon: Stethoscope, href: "/admin/treatments" },
        { label: "Dentists", value: content.dentists.length, icon: UserRound, href: "/admin/dentists" },
        { label: "FAQs", value: content.faqs.length, icon: HelpCircle, href: "/admin/faqs" },
      ]
    : [
        { label: "New requests", value: newCount, icon: CalendarClock, href: "/admin/appointments" },
        { label: "Confirmed", value: appointments.filter((a) => a.status === "confirmed").length, icon: CalendarCheck, href: "/admin/appointments" },
        { label: "Days in clinic", value: dentist ? dentist.hours.filter(Boolean).length : 0, icon: Clock, href: "/admin/my-profile" },
      ]
  const recent = appointments.slice(0, 5)

  return (
    <PageBody wide>
      {isAdmin ? (
        <PageHeader title="Dashboard" description="Overview of the clinic website and incoming appointment requests." />
      ) : (
        <PageHeader
          title={`Welcome, ${dentist?.name ?? "doctor"}`}
          description={dentist ? `Your clinic days: ${daysText(dentist.hours)}. Requests for you and unassigned requests appear below.` : undefined}
        />
      )}
      <div className={isAdmin ? "grid grid-cols-2 gap-4 lg:grid-cols-4" : "grid grid-cols-2 gap-4 lg:grid-cols-3"}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
                <CardAction>
                  <s.icon className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <section className="grid gap-3" aria-labelledby="dashboard-calendar">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="grid gap-1">
            <h2 id="dashboard-calendar" className="text-lg font-semibold">
              {isAdmin ? "Calendar" : "My calendar"}
            </h2>
            <p className="text-sm text-muted-foreground">Click a day to see who&rsquo;s in, or a request to confirm or reschedule it.</p>
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/calendar" />}>
            Full calendar <ArrowRight />
          </Button>
        </div>
        <AppointmentCalendar />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Latest appointment requests</CardTitle>
          <CardDescription>Submitted from the booking form on the website.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/appointments" />}>
              View all <ArrowRight />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No requests yet. They will appear here when patients use the booking form.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead className="hidden md:table-cell">Preferred</TableHead>
                  <TableHead className="hidden sm:table-cell">Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.treatment}</TableCell>
                    <TableCell className="hidden md:table-cell">{preferredLabel(a)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{receivedLabel(a)}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageBody>
  )
}
