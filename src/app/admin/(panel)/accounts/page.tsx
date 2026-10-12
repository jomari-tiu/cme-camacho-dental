"use client"

import { useState } from "react"
import { KeyRound, Loader2, Pencil, Plus, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import type { DentistAccount } from "@/content/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDelete, Field, TextField } from "@/components/admin/fields"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { ADMIN_EMAIL } from "@/lib/auth"
import { newId, useCms } from "@/lib/cms-store"
import { hashPassword } from "@/lib/password"
import { dotColor } from "@/lib/schedule"
import { createAccountSchema, editAccountSchema, issueMap, resetPasswordSchema, type AccountRules } from "@/lib/validation"

type Form = { name: string; email: string; dentistId: string; password: string; confirm: string }
type DialogState = { mode: "create" } | { mode: "edit"; account: DentistAccount } | { mode: "password"; account: DentistAccount } | null

export default function AccountsPage() {
  const { accounts, content, updateAccounts } = useCms()
  const [dialog, setDialog] = useState<DialogState>(null)
  const dentistById = new Map(content.dentists.map((d) => [d.id, d]))
  const withoutLogin = content.dentists.filter((d) => !accounts.some((a) => a.dentistId === d.id))

  const setActive = async (account: DentistAccount, active: boolean) => {
    await updateAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, active } : a)))
    toast.success(active ? `${account.name} can sign in again` : `${account.name} can no longer sign in`)
  }

  return (
    <PageBody>
      <PageHeader
        title="Dentist accounts"
        description="Logins for dentists. Each account is linked to one dentist profile and can only see that dentist's appointments and edit their own profile and hours."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })} disabled={content.dentists.length === 0}>
            <Plus /> Add account
          </Button>
        }
      />

      {withoutLogin.length > 0 && accounts.length > 0 && (
        <p className="text-sm text-muted-foreground">
          No login yet: {withoutLogin.map((d) => d.shortName).join(", ")}.
        </p>
      )}

      <Card className="py-0">
        <CardContent className="px-0">
          {accounts.length === 0 ? (
            <div className="grid justify-items-center gap-3 py-16 text-center">
              <KeyRound className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No dentist accounts yet. Create one so a dentist can sign in at /admin.</p>
              <Button variant="outline" onClick={() => setDialog({ mode: "create" })} disabled={content.dentists.length === 0}>
                <Plus /> Add account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Account</TableHead>
                  <TableHead>Dentist profile</TableHead>
                  <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                  <TableHead>Can sign in</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => {
                  const dentist = dentistById.get(a.dentistId)
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="pl-4">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      </TableCell>
                      <TableCell>
                        {dentist ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ background: dotColor(dentist.hue) }} />
                            {dentist.shortName}
                          </span>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <TriangleAlert className="size-3" /> Profile removed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {a.lastLoginAt
                          ? new Date(a.lastLoginAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Switch checked={a.active} onCheckedChange={(v) => setActive(a, v)} aria-label={`Allow ${a.name} to sign in`} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end">
                          <Button variant="ghost" size="icon-sm" aria-label="Edit account" onClick={() => setDialog({ mode: "edit", account: a })}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Reset password" onClick={() => setDialog({ mode: "password", account: a })}>
                            <KeyRound />
                          </Button>
                          <ConfirmDelete
                            title={`Delete ${a.name}'s account?`}
                            description="They will be signed out and can no longer sign in. Their dentist profile stays on the website."
                            onConfirm={async () => {
                              await updateAccounts((list) => list.filter((x) => x.id !== a.id))
                              toast.success("Account deleted")
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog?.mode === "password" ? (
            <ResetPasswordForm account={dialog.account} onDone={() => setDialog(null)} />
          ) : dialog ? (
            <AccountForm key={dialog.mode === "edit" ? dialog.account.id : "new"} editing={dialog.mode === "edit" ? dialog.account : null} onDone={() => setDialog(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </PageBody>
  )
}

function AccountForm({ editing, onDone }: { editing: DentistAccount | null; onDone: () => void }) {
  const { accounts, content, updateAccounts } = useCms()
  const others = accounts.filter((a) => a.id !== editing?.id)
  const rules: AccountRules = {
    takenEmails: [...others.map((a) => a.email.toLowerCase()), ADMIN_EMAIL.toLowerCase()],
    linkedDentistIds: others.map((a) => a.dentistId),
    dentistIds: content.dentists.map((d) => d.id),
  }
  const firstFree = content.dentists.find((d) => !rules.linkedDentistIds.includes(d.id))
  const [form, setForm] = useState<Form>({
    name: editing?.name ?? firstFree?.name.replace(/\[Name\]/, "").trim() ?? "",
    email: editing?.email ?? "",
    dentistId: editing?.dentistId ?? firstFree?.id ?? "",
    password: "",
    confirm: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const schema = editing ? editAccountSchema(rules) : createAccountSchema(rules)
  const parsed = schema.safeParse(form)
  const errors = submitted && !parsed.success ? issueMap(parsed.error) : {}
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const dentistItems = content.dentists.map((d) => ({
    value: d.id,
    label: d.shortName + (rules.linkedDentistIds.includes(d.id) ? " (has an account)" : ""),
  }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!parsed.success) return
    setBusy(true)
    try {
      const data = { name: form.name.trim(), email: form.email.trim().toLowerCase(), dentistId: form.dentistId }
      if (editing) {
        await updateAccounts((list) => list.map((a) => (a.id === editing.id ? { ...a, ...data } : a)))
        toast.success("Account updated")
      } else {
        const account: DentistAccount = {
          id: newId(),
          ...data,
          ...(await hashPassword(form.password)),
          active: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
        }
        await updateAccounts((list) => [...list, account])
        toast.success("Account created", { description: `${account.name} can now sign in at /admin with ${account.email}.` })
      }
      onDone()
    } catch {
      toast.error("Could not save the account")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit account" : "New dentist account"}</DialogTitle>
        <DialogDescription>
          {editing ? "Change the name, sign-in email or linked dentist profile." : "The dentist signs in at /admin with this email and password."}
        </DialogDescription>
      </DialogHeader>
      <Field label="Dentist profile" error={errors.dentistId}>
        <Select items={dentistItems} value={form.dentistId || null} onValueChange={(v) => v && set("dentistId")(v)}>
          <SelectTrigger className="w-full" aria-invalid={!!errors.dentistId}>
            <SelectValue placeholder="Choose a dentist" />
          </SelectTrigger>
          <SelectContent>
            {dentistItems.map((d) => (
              <SelectItem key={d.value} value={d.value} disabled={rules.linkedDentistIds.includes(d.value)}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <TextField label="Name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Dr. Juan Dela Cruz" />
      <TextField label="Sign-in email" type="email" inputMode="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="name@example.com" />
      {!editing && <PasswordFields form={form} set={set} errors={errors} />}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {editing ? "Save changes" : "Create account"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function ResetPasswordForm({ account, onDone }: { account: DentistAccount; onDone: () => void }) {
  const { updateAccounts } = useCms()
  const [form, setForm] = useState({ password: "", confirm: "" })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const parsed = resetPasswordSchema.safeParse(form)
  const errors = submitted && !parsed.success ? issueMap(parsed.error) : {}
  const set = (k: "password" | "confirm") => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!parsed.success) return
    setBusy(true)
    const hashed = await hashPassword(form.password)
    await updateAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, ...hashed } : a)))
    setBusy(false)
    toast.success(`Password changed for ${account.name}`)
    onDone()
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>
          Set a new password for {account.name} ({account.email}). Share it with them privately.
        </DialogDescription>
      </DialogHeader>
      <PasswordFields form={form} set={set} errors={errors} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Set password
        </Button>
      </DialogFooter>
    </form>
  )
}

function PasswordFields({
  form,
  set,
  errors,
}: {
  form: { password: string; confirm: string }
  set: (k: "password" | "confirm") => (v: string) => void
  errors: Record<string, string>
}) {
  return (
    <>
      <Field label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number.">
        <Input type="password" autoComplete="new-password" value={form.password} aria-invalid={!!errors.password} onChange={(e) => set("password")(e.target.value)} />
      </Field>
      <Field label="Confirm password" error={errors.confirm}>
        <Input type="password" autoComplete="new-password" value={form.confirm} aria-invalid={!!errors.confirm} onChange={(e) => set("confirm")(e.target.value)} />
      </Field>
    </>
  )
}
