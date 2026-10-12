"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { AppointmentStatus } from "@/content/schema"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminUser } from "@/components/admin/admin-shell"
import { useVisibleAppointments } from "@/components/admin/use-visible-appointments"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { STATUS, preferredLabel, receivedLabel } from "@/components/admin/appointment-utils"
import { AppointmentSheet, StatusSelect, useSetStatus } from "@/components/admin/appointment-sheet"

const STATUSES = Object.keys(STATUS) as AppointmentStatus[]

export default function AppointmentsPage() {
  const { isAdmin } = useAdminUser()
  const appointments = useVisibleAppointments()
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = appointments.find((a) => a.id === openId) ?? null

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: appointments.length }
    for (const s of STATUSES) c[s] = appointments.filter((a) => a.status === s).length
    return c
  }, [appointments])

  const rows = appointments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false
    const q = query.trim().toLowerCase()
    return !q || [a.name, a.phone, a.treatment, a.dentist, a.notes].some((f) => f.toLowerCase().includes(q))
  })

  const setStatus = useSetStatus()

  return (
    <PageBody>
      <PageHeader
        title="Appointments"
        description={
          isAdmin
            ? "Requests sent from the website booking form. Confirm each one by text or call, then update its status."
            : "Requests for you, plus requests with no preferred dentist. Confirm each one by text or call, then update its status."
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            {(["all", ...STATUSES] as const).map((s) => (
              <TabsTrigger key={s} value={s}>
                {s === "all" ? "All" : STATUS[s].label}
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">{counts[s]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone…" className="pl-8" />
        </div>
      </div>
      <Card className="py-0">
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {appointments.length === 0 ? "No appointment requests yet." : "No requests match this filter."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Patient</TableHead>
                  <TableHead className="hidden lg:table-cell">Treatment</TableHead>
                  <TableHead className="hidden md:table-cell">Preferred</TableHead>
                  <TableHead className="hidden xl:table-cell">Dentist</TableHead>
                  <TableHead className="hidden sm:table-cell">Received</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpenId(a.id)}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{a.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{a.phone}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{a.treatment}</TableCell>
                    <TableCell className="hidden md:table-cell">{preferredLabel(a)}</TableCell>
                    <TableCell className="hidden xl:table-cell">{a.dentist}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{receivedLabel(a)}</TableCell>
                    <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect value={a.status} onChange={(s) => setStatus(a, s)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AppointmentSheet appointment={open} onClose={() => setOpenId(null)} />
    </PageBody>
  )
}
