"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, ImageOff, Pencil, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDelete, ReorderButtons } from "@/components/admin/fields"
import { useListActions } from "@/components/admin/list-actions"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { useCms } from "@/lib/cms-store"

export default function TreatmentsPage() {
  const router = useRouter()
  const { content } = useCms()
  const { list, move, remove, duplicate, add } = useListActions("treatments")

  const create = async () => {
    const id = await add({
      name: "New treatment",
      images: [],
      duration: "",
      visits: "",
      description: "",
      steps: [],
      goodFor: "",
      placeholderHint: "treatment photo",
    })
    if (id) router.push("/admin/treatments/" + id)
  }

  return (
    <PageBody>
      <PageHeader
        title="Treatments"
        description="Services listed in the “What we do” section and the booking form. Order here is the order on the site."
        actions={
          <Button onClick={create}>
            <Plus /> Add treatment
          </Button>
        }
      />
      <div className="grid gap-3">
        {list.map((t, i) => (
          <Card key={t.id} className="flex-row items-center gap-4 p-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-900">
              {t.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.images[0]} alt="" className="size-full object-cover" />
              ) : (
                <ImageOff className="size-5 text-neutral-500" />
              )}
            </div>
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <Link href={"/admin/treatments/" + t.id} className="truncate font-medium hover:underline">
                  {t.name}
                </Link>
                {t.id === content.booking.defaultTreatmentId && <Badge variant="secondary">Default</Badge>}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {[t.duration, t.visits, `${t.images.length} photo${t.images.length === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center">
              <ReorderButtons index={i} length={list.length} onMove={move} />
              <Button variant="ghost" size="icon-sm" aria-label="Duplicate" onClick={() => duplicate(t.id)}>
                <Copy />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Edit" nativeButton={false} render={<Link href={"/admin/treatments/" + t.id} />}>
                <Pencil />
              </Button>
              <ConfirmDelete title={`Delete “${t.name}”?`} description="It will be removed from the website and booking form." onConfirm={() => remove(t.id)} />
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No treatments yet.</p>}
      </div>
    </PageBody>
  )
}
