"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CheckCheck, ExternalLink, Inbox, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { OutboxMessage, OutboxStatus } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDelete } from "@/components/admin/fields"
import { ChannelIcon, OUTBOX_STATUS, OutboxStatusBadge, manualSendHref, shortTime } from "@/components/admin/outbox-utils"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { useCms } from "@/lib/cms-store"
import { deliver } from "@/lib/notifications/dispatch"
import { EVENT_META } from "@/lib/notifications/templates"
import { transport } from "@/lib/notifications/transport"

type Filter = "all" | OutboxStatus
const FILTERS: Filter[] = ["all", "queued", "sent", "failed", "skipped"]

export default function OutboxPage() {
  const { outbox, updateOutbox } = useCms()
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = outbox.find((m) => m.id === openId) ?? null

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: outbox.length }
    for (const s of FILTERS.slice(1)) c[s] = outbox.filter((m) => m.status === s).length
    return c
  }, [outbox])
  const rows = outbox.filter((m) => filter === "all" || m.status === filter)

  const patch = (id: string, p: Partial<OutboxMessage>) => updateOutbox((list) => list.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const markSent = async (m: OutboxMessage) => {
    await patch(m.id, { status: "sent", note: "Sent manually", sentAt: new Date().toISOString() })
    toast.success("Marked as sent")
  }
  const retry = async (ids: string[]) => {
    const targets = outbox.filter((m) => ids.includes(m.id))
    const results = await deliver(targets.map((m) => ({ ...m, status: "queued" as const })))
    await updateOutbox((list) => list.map((m) => results.find((r) => r.id === m.id) ?? m))
    const sent = results.filter((r) => r.status === "sent").length
    toast[sent ? "success" : "info"](sent ? `${sent} sent` : "Still waiting — no delivery backend is connected yet")
  }
  const waiting = outbox.filter((m) => m.status === "queued" || m.status === "failed").map((m) => m.id)

  return (
    <PageBody wide>
      <PageHeader
        title="Outbox"
        description={
          transport.connected
            ? "Every SMS and email the system sent or tried to send."
            : "No delivery backend is connected yet. Messages are prepared here; open one to send it from your phone or email, then mark it as sent."
        }
        actions={
          <>
            <Button variant="outline" disabled={!waiting.length} onClick={() => retry(waiting)}>
              <RefreshCw /> Retry waiting
            </Button>
            <ConfirmDelete
              title="Clear sent and not-sent messages?"
              description="Waiting and failed messages are kept."
              confirmLabel="Clear"
              onConfirm={async () => {
                await updateOutbox((list) => list.filter((m) => m.status === "queued" || m.status === "failed"))
                toast.success("Outbox cleaned up")
              }}
              trigger={<Button variant="outline" disabled={!counts.sent && !counts.skipped} />}
              label={
                <>
                  <Trash2 /> Clear history
                </>
              }
            />
          </>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f}>
              {f === "all" ? "All" : OUTBOX_STATUS[f].label}
              <span className="ml-1 text-xs text-muted-foreground tabular-nums">{counts[f]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="py-0">
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <div className="grid justify-items-center gap-2 py-16 text-center text-sm text-muted-foreground">
              <Inbox className="size-6" />
              {outbox.length === 0 ? (
                <>
                  No messages yet. They appear here when a booking arrives or an appointment&rsquo;s status changes.
                  <Link href="/admin/templates" className="underline underline-offset-2">
                    Edit message templates
                  </Link>
                </>
              ) : (
                "No messages match this filter."
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Patient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => setOpenId(m.id)}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{m.patientName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{m.to || "—"}</div>
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={m.channel} />
                        <span className="text-sm">{EVENT_META[m.event].label}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.channel === "email" ? m.subject : m.body}</div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{shortTime(m.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <div className="grid justify-items-start gap-0.5">
                        <OutboxStatusBadge status={m.status} />
                        {m.note && <span className="text-xs text-muted-foreground">{m.note}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="sm:max-w-md">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ChannelIcon channel={open.channel} /> {EVENT_META[open.event].label}
                </SheetTitle>
                <SheetDescription>
                  To {open.patientName} · {open.to || "no address"} · {shortTime(open.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <OutboxStatusBadge status={open.status} />
                  {open.note && <span className="text-muted-foreground">{open.note}</span>}
                  {open.sentAt && <span className="text-muted-foreground">· {shortTime(open.sentAt)}</span>}
                </div>
                {open.channel === "email" && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subject:</span> <span className="font-medium">{open.subject}</span>
                  </div>
                )}
                <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{open.body}</div>
              </div>
              <SheetFooter className="grid gap-2">
                {open.to && open.status !== "sent" && (
                  <Button nativeButton={false} render={<a href={manualSendHref(open)} />}>
                    <ExternalLink /> Open in {open.channel === "sms" ? "SMS app" : "email app"}
                  </Button>
                )}
                {open.to && open.status !== "sent" && (
                  <Button variant="outline" onClick={() => markSent(open)}>
                    <CheckCheck /> Mark as sent
                  </Button>
                )}
                {(open.status === "queued" || open.status === "failed") && (
                  <Button variant="outline" onClick={() => retry([open.id])}>
                    <RefreshCw /> Retry through backend
                  </Button>
                )}
                <ConfirmDelete
                  title="Delete this message?"
                  onConfirm={async () => {
                    await updateOutbox((list) => list.filter((m) => m.id !== open.id))
                    setOpenId(null)
                  }}
                  trigger={<Button variant="ghost" className="text-destructive" />}
                />
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageBody>
  )
}
