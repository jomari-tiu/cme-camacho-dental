"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { CircleAlert, Mail, MessageSquare, PlugZap, RotateCcw, Send } from "lucide-react"
import { toast } from "sonner"
import type { MessageTemplate, NotificationEvent } from "@/content/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Field, TextField } from "@/components/admin/fields"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { useCms } from "@/lib/cms-store"
import {
  EVENT_META,
  SAMPLE_APPOINTMENT,
  VARIABLES,
  defaultTemplate,
  render,
  settingsFormSchema,
  smsInfo,
  templateFormSchema,
  templateValues,
  type TemplateVariable,
} from "@/lib/notifications/templates"
import { transport } from "@/lib/notifications/transport"
import { cn } from "@/lib/utils"
import { issueMap } from "@/lib/validation"

type Draft = Pick<MessageTemplate, "enabled" | "subject" | "body">
const EVENTS = Object.keys(EVENT_META) as NotificationEvent[]
const pick = (t: MessageTemplate): Draft => ({ enabled: t.enabled, subject: t.subject, body: t.body })
const same = (a: Draft, b: Draft) => a.enabled === b.enabled && a.subject === b.subject && a.body === b.body

export default function TemplatesPage() {
  return (
    <PageBody wide>
      <PageHeader
        title="Message templates"
        description="The SMS and email patients receive when their appointment changes. Use {variables} to fill in each patient's details."
      />
      <DeliveryStatus />
      <Tabs defaultValue="templates" className="gap-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Delivery settings</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <TemplateEditor />
        </TabsContent>
        <TabsContent value="settings">
          <DeliverySettings />
        </TabsContent>
      </Tabs>
    </PageBody>
  )
}

function DeliveryStatus() {
  const { outbox } = useCms()
  const queued = outbox.filter((m) => m.status === "queued").length
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        transport.connected ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <span className="flex items-center gap-2">
        <PlugZap className={cn("size-4", transport.connected ? "text-emerald-600" : "text-amber-600")} />
        <span>
          <span className="font-medium">{transport.connected ? "Delivery connected." : "No delivery backend yet."}</span>{" "}
          {transport.connected
            ? "Messages are sent automatically."
            : "Messages are prepared automatically and wait in the Outbox, where they can be sent by hand."}
        </span>
      </span>
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/outbox" />}>
        <Send /> Outbox{queued > 0 ? ` · ${queued} waiting` : ""}
      </Button>
    </div>
  )
}

function TemplateEditor() {
  const { notificationConfig, saveNotificationConfig, content } = useCms()
  const saved = useMemo(() => Object.fromEntries(notificationConfig.templates.map((t) => [t.id, pick(t)])), [notificationConfig])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [selectedId, setSelectedId] = useState(notificationConfig.templates[2]?.id ?? notificationConfig.templates[0]?.id)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const templates = notificationConfig.templates
  const current = (t: MessageTemplate): Draft => drafts[t.id] ?? saved[t.id]
  const dirtyIds = templates.filter((t) => drafts[t.id] && !same(drafts[t.id], saved[t.id])).map((t) => t.id)
  const errorsById = Object.fromEntries(
    templates.map((t) => {
      const parsed = templateFormSchema(t.channel).safeParse(current(t))
      return [t.id, parsed.success ? {} : issueMap(parsed.error)]
    }),
  ) as Record<string, Record<string, string>>
  const invalidDirty = dirtyIds.filter((id) => Object.keys(errorsById[id]).length > 0)

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]
  if (!selected) return null
  const draft = current(selected)
  const errors = showErrors || Object.keys(errorsById[selected.id]).length ? errorsById[selected.id] : {}
  const setDraft = (patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [selected.id]: { ...current(selected), ...patch } }))

  const insertVariable = (v: TemplateVariable) => {
    const token = `{${v}}`
    const el = bodyRef.current
    const start = el?.selectionStart ?? draft.body.length
    const end = el?.selectionEnd ?? draft.body.length
    setDraft({ body: draft.body.slice(0, start) + token + draft.body.slice(end) })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const save = async () => {
    if (invalidDirty.length) {
      setShowErrors(true)
      setSelectedId(invalidDirty[0])
      toast.error("Some templates need fixing", { description: "Check the highlighted fields, then save again." })
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    await saveNotificationConfig({
      ...notificationConfig,
      templates: templates.map((t) => (dirtyIds.includes(t.id) ? { ...t, ...drafts[t.id], updatedAt: now } : t)),
    })
    setDrafts({})
    setShowErrors(false)
    setSaving(false)
    toast.success(dirtyIds.length === 1 ? "Template saved" : `${dirtyIds.length} templates saved`)
  }

  const values = templateValues(SAMPLE_APPOINTMENT, content)
  const previewBody = render(draft.body, values)
  const previewSubject = render(draft.subject, values)
  const sms = smsInfo(previewBody)
  const meta = EVENT_META[selected.event]
  const isDefault = same(draft, pick(defaultTemplate(selected.event, selected.channel)))

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="gap-0 py-0">
        {EVENTS.map((event) => (
          <div key={event} className="border-b p-3 last:border-b-0">
            <div className="mb-1.5 px-1 text-sm font-medium">{EVENT_META[event].label}</div>
            <div className="grid gap-1">
              {templates
                .filter((t) => t.event === event)
                .map((t) => {
                  const d = current(t)
                  const hasError = Object.keys(errorsById[t.id]).length > 0
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        t.id === selected.id && "bg-accent font-medium",
                      )}
                    >
                      {t.channel === "sms" ? <MessageSquare className="size-4 text-muted-foreground" /> : <Mail className="size-4 text-muted-foreground" />}
                      <span className="flex-1">{t.channel === "sms" ? "SMS" : "Email"}</span>
                      {hasError && <CircleAlert className="size-4 text-destructive" aria-label="Needs fixing" />}
                      {dirtyIds.includes(t.id) && <span className="size-2 rounded-full bg-amber-500" title="Unsaved changes" />}
                      <Badge variant={d.enabled ? "secondary" : "outline"} className="text-[10px]">
                        {d.enabled ? "On" : "Off"}
                      </Badge>
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {meta.label}
              <Badge variant="outline">{selected.channel === "sms" ? "SMS" : "Email"}</Badge>
            </CardTitle>
            <CardDescription>
              {meta.description} <span className="text-foreground">Sent: {meta.automatic.toLowerCase()}.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <Label htmlFor="tpl-enabled">Send this {selected.channel === "sms" ? "SMS" : "email"}</Label>
              <Switch id="tpl-enabled" checked={draft.enabled} onCheckedChange={(v) => setDraft({ enabled: v })} />
            </div>
            {selected.channel === "email" && (
              <TextField label="Subject" value={draft.subject} onChange={(v) => setDraft({ subject: v })} error={errors.subject} />
            )}
            <Field label="Message" error={errors.body}>
              <Textarea
                ref={bodyRef}
                value={draft.body}
                rows={selected.channel === "sms" ? 5 : 12}
                aria-invalid={!!errors.body}
                onChange={(e) => setDraft({ body: e.target.value })}
                className="font-mono text-[13px]"
              />
            </Field>
            {selected.channel === "sms" && (
              <p className={cn("-mt-3 text-xs", sms.parts > 2 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                Preview length: {sms.length} characters · {sms.parts} SMS {sms.parts === 1 ? "part" : "parts"}
                {sms.unicode && ` · uses ${sms.special.map((c) => `“${c}”`).join(" ")}, which switches the SMS to Unicode (70 characters per part). Replace it to halve the cost.`}
                {sms.parts > 2 && " · long messages cost more per send"}
              </p>
            )}
            <div className="grid gap-2">
              <span className="text-sm font-medium">Insert a variable</span>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(VARIABLES) as TemplateVariable[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    title={VARIABLES[v]}
                    onClick={() => insertVariable(v)}
                    className="rounded-md border bg-muted/50 px-2 py-1 font-mono text-xs hover:bg-muted"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <Button variant="ghost" size="sm" disabled={isDefault} onClick={() => setDraft(pick(defaultTemplate(selected.event, selected.channel)))}>
                <RotateCcw /> Restore default wording
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={!dirtyIds.length || saving} onClick={() => (setDrafts({}), setShowErrors(false))}>
                  Discard
                </Button>
                <Button disabled={!dirtyIds.length || saving} onClick={save}>
                  Save{dirtyIds.length > 1 ? ` ${dirtyIds.length} templates` : ""}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="self-start xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>With a sample patient ({SAMPLE_APPOINTMENT.name}).</CardDescription>
          </CardHeader>
          <CardContent>
            {selected.channel === "sms" ? (
              <div className="rounded-2xl bg-muted/60 p-3">
                <div className="mb-2 text-center text-[11px] text-muted-foreground">
                  {notificationConfig.senderName} · {content.contact.primaryPhone}
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-background px-3 py-2 text-sm whitespace-pre-wrap shadow-sm">
                  {previewBody || <span className="text-muted-foreground">Empty message</span>}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border text-sm">
                <div className="grid gap-0.5 border-b bg-muted/40 px-3 py-2 text-xs">
                  <span>
                    <span className="text-muted-foreground">From:</span> {notificationConfig.senderName}
                  </span>
                  <span>
                    <span className="text-muted-foreground">To:</span> {SAMPLE_APPOINTMENT.email}
                  </span>
                  <span className="font-medium">{previewSubject || "(no subject)"}</span>
                </div>
                <div className="px-3 py-3 whitespace-pre-wrap">{previewBody}</div>
              </div>
            )}
            {!draft.enabled && <p className="mt-3 text-xs text-muted-foreground">This template is off, so it won&rsquo;t be sent.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DeliverySettings() {
  const { notificationConfig, saveNotificationConfig } = useCms()
  const initial = { channels: notificationConfig.channels, senderName: notificationConfig.senderName, replyTo: notificationConfig.replyTo }
  const [form, setForm] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const parsed = settingsFormSchema.safeParse(form)
  const errors = submitted && !parsed.success ? issueMap(parsed.error) : {}
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const save = async () => {
    setSubmitted(true)
    if (!parsed.success) return
    await saveNotificationConfig({ ...notificationConfig, ...parsed.data })
    setSubmitted(false)
    toast.success("Delivery settings saved")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Channels &amp; sender</CardTitle>
          <CardDescription>Turn a whole channel off to stop all of its messages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {(["sms", "email"] as const).map((c) => (
            <div key={c} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <Label htmlFor={`ch-${c}`} className="flex items-center gap-2">
                {c === "sms" ? <MessageSquare className="size-4" /> : <Mail className="size-4" />}
                {c === "sms" ? "SMS messages" : "Email messages"}
              </Label>
              <Switch
                id={`ch-${c}`}
                checked={form.channels[c]}
                onCheckedChange={(v) => setForm((f) => ({ ...f, channels: { ...f.channels, [c]: v } }))}
              />
            </div>
          ))}
          <TextField
            label="Sender name"
            value={form.senderName}
            onChange={(v) => setForm((f) => ({ ...f, senderName: v }))}
            error={errors.senderName}
            hint="Email “From” name, and the SMS sender name if your SMS provider supports one."
          />
          <TextField
            label="Reply-to email (optional)"
            type="email"
            value={form.replyTo}
            onChange={(v) => setForm((f) => ({ ...f, replyTo: v }))}
            error={errors.replyTo}
            placeholder="cmec.dental@gmail.com"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={!dirty} onClick={() => (setForm(initial), setSubmitted(false))}>
              Discard
            </Button>
            <Button disabled={!dirty} onClick={save}>
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connecting a backend</CardTitle>
          <CardDescription>Everything in the app is ready; only the delivery service is missing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>
            Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_NOTIFICATIONS_API_URL</code> to your backend&rsquo;s endpoint. Each message is then
            sent there as:
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{`POST <url>
{ "id", "channel": "sms" | "email", "to",
  "subject", "body", "event", "appointmentId" }`}</pre>
          <p className="text-muted-foreground">
            The backend delivers it, for example through an Android SMS gateway using the clinic&rsquo;s SIM, or an SMS/email provider, and keeps
            provider keys private. The day-before reminder also needs the backend to run a daily job.
          </p>
          <p className="text-muted-foreground">
            Status: <span className="font-medium text-foreground">{transport.label}</span>
          </p>
          <Input readOnly value={process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL ?? "(not set)"} className="font-mono text-xs" aria-label="Current endpoint" />
        </CardContent>
      </Card>
    </div>
  )
}
