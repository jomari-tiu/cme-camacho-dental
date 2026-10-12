"use client"

import { useRef } from "react"
import { Download, RotateCcw, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { migrateContent } from "@/content/migrate"
import { backupSchema } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { ConfirmDelete } from "@/components/admin/fields"
import { PageBody, PageHeader, Section } from "@/components/admin/page-chrome"
import { useCms } from "@/lib/cms-store"

export default function SettingsPage() {
  const { content, appointments, accounts, saveContent, resetContent, replaceAppointments, updateAccounts } = useCms()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ content, appointments, accounts }, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `cme-website-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importBackup = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      // Backups from older versions are upgraded (e.g. section layout) before validation.
      const parsed = backupSchema.safeParse(raw && typeof raw === "object" ? { ...raw, content: migrateContent(raw.content) } : raw)
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        toast.error("Invalid backup file", {
          description: issue ? `${issue.path.join(" → ") || "File"}: ${issue.message}` : "The file does not match the website content format.",
        })
        return
      }
      await saveContent(parsed.data.content)
      if (parsed.data.appointments) await replaceAppointments(parsed.data.appointments)
      if (parsed.data.accounts) await updateAccounts(() => parsed.data.accounts!)
      toast.success("Backup restored")
    } catch {
      toast.error("Could not read that file")
    }
  }

  return (
    <PageBody>
      <PageHeader title="Settings & backup" description="Content is stored in this browser. Export a backup to move it to another computer or keep it safe." />

      <Section title="Backup" description="Includes all website content, uploaded images, appointment requests and dentist accounts (passwords stay hashed). Keep the file private.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportBackup}>
            <Download /> Export backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (f) importBackup(f)
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Importing replaces the current content (and appointment requests, if the file contains them).
        </p>
      </Section>

      <Section title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div className="grid gap-1">
            <span className="text-sm font-medium">Reset content to the original design</span>
            <span className="text-sm text-muted-foreground">All content edits and uploaded images are lost. Appointments are kept.</span>
          </div>
          <ConfirmDelete
            title="Reset all website content?"
            description="This restores the original text and photos. Export a backup first if you might need your edits."
            onConfirm={async () => {
              await resetContent()
              toast.success("Content reset to defaults")
            }}
            trigger={<Button variant="outline" />}
            confirmLabel="Reset"
            label={
              <>
                <RotateCcw /> Reset content
              </>
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div className="grid gap-1">
            <span className="text-sm font-medium">Delete all appointment requests</span>
            <span className="text-sm text-muted-foreground">{appointments.length} request(s) stored in this browser.</span>
          </div>
          <ConfirmDelete
            title="Delete all appointment requests?"
            description="This cannot be undone."
            onConfirm={async () => {
              await replaceAppointments([])
              toast.success("Appointments cleared")
            }}
            trigger={<Button variant="destructive" disabled={appointments.length === 0} />}
            label={
              <>
                <Trash2 /> Delete all
              </>
            }
          />
        </div>
      </Section>
    </PageBody>
  )
}
