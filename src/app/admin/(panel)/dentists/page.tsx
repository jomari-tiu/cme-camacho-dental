"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Pencil, Plus, UserRound, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDelete, ReorderButtons } from "@/components/admin/fields"
import { useListActions } from "@/components/admin/list-actions"
import { PageBody, PageHeader } from "@/components/admin/page-chrome"
import { daysText, dotColor } from "@/lib/schedule"
import { useCms } from "@/lib/cms-store"
import { Badge } from "@/components/ui/badge"

export default function DentistsPage() {
  const router = useRouter()
  const { list, move, remove, duplicate, add } = useListActions("dentists")
  const { accounts } = useCms()

  const create = async () => {
    const id = await add({
      shortName: "Dr. New",
      name: "Dr. New",
      role: "Associate dentist",
      bio: "",
      tags: [],
      photo: "",
      hue: Math.round(Math.random() * 360),
      hours: [null, [9, 17], [9, 17], [9, 17], [9, 17], [9, 17], null],
    })
    if (id) router.push("/admin/dentists/" + id)
  }

  return (
    <PageBody>
      <PageHeader
        title="Dentists & hours"
        description="Profiles in “The people behind the chair” and the weekly hours that drive the schedule."
        actions={
          <Button onClick={create}>
            <Plus /> Add dentist
          </Button>
        }
      />
      <div className="grid gap-3">
        {list.map((d, i) => (
          <Card key={d.id} className="flex-row items-center gap-4 p-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
              {d.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photo} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: dotColor(d.hue) }} />
                <Link href={"/admin/dentists/" + d.id} className="truncate font-medium hover:underline">
                  {d.name}
                </Link>
                <span className="truncate text-sm text-muted-foreground">· {d.shortName}</span>
                {accounts.some((a) => a.dentistId === d.id) && (
                  <Badge variant="secondary" className="gap-1">
                    <KeyRound className="size-3" /> Login
                  </Badge>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {d.role} · {daysText(d.hours)}
              </p>
            </div>
            <div className="flex items-center">
              <ReorderButtons index={i} length={list.length} onMove={move} />
              <Button variant="ghost" size="icon-sm" aria-label="Duplicate" onClick={() => duplicate(d.id)}>
                <Copy />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Edit" nativeButton={false} render={<Link href={"/admin/dentists/" + d.id} />}>
                <Pencil />
              </Button>
              <ConfirmDelete title={`Delete ${d.name}?`} description="Their profile and schedule will be removed from the website." onConfirm={() => remove(d.id)} />
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No dentists yet.</p>}
      </div>
    </PageBody>
  )
}
