"use client"

import { Plus } from "lucide-react"
import type { Faq } from "@/content/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDelete, ReorderButtons, TextField, move } from "@/components/admin/fields"
import { PageBody, PageHeader, SaveBar } from "@/components/admin/page-chrome"
import { useContentDraft } from "@/components/admin/use-draft"
import { newId } from "@/lib/cms-store"

export default function FaqsPage() {
  const d = useContentDraft()
  const { draft, setDraft, errorAt } = d
  const faqs = draft.faqs
  const setFaqs = (next: Faq[]) => setDraft((c) => ({ ...c, faqs: next }))
  const update = (id: string, patch: Partial<Faq>) => setFaqs(faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  return (
    <PageBody>
      <PageHeader
        title="FAQs"
        description="Questions in the “Questions, answered” section. The first one opens by default."
        actions={
          <Button onClick={() => setFaqs([...faqs, { id: newId(), question: "", answer: "" }])}>
            <Plus /> Add question
          </Button>
        }
      />
      <div className="grid gap-3">
        {faqs.map((f, i) => (
          <Card key={f.id}>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                <div className="flex">
                  <ReorderButtons index={i} length={faqs.length} onMove={(a, b) => setFaqs(move(faqs, a, b))} />
                  <ConfirmDelete
                    title="Delete this question?"
                    description="It is removed when you save."
                    onConfirm={() => setFaqs(faqs.filter((x) => x.id !== f.id))}
                  />
                </div>
              </div>
              <TextField label="Question" value={f.question} onChange={(v) => update(f.id, { question: v })} error={errorAt("faqs", i, "question")} />
              <TextField label="Answer" value={f.answer} onChange={(v) => update(f.id, { answer: v })} error={errorAt("faqs", i, "answer")} multiline />
            </CardContent>
          </Card>
        ))}
        {faqs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No questions yet.</p>}
      </div>
      <SaveBar draft={d} />
    </PageBody>
  )
}
