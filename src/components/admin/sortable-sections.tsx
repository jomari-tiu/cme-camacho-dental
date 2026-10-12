"use client"

import { useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, EyeOff, GripVertical, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type CardProps = {
  title: string
  description: string
  /** Shown before the title, e.g. the section's position. */
  position?: string
  /** Fixed cards (header/footer) can't be dragged or hidden. */
  locked?: boolean
  visible?: boolean
  onVisibleChange?: (v: boolean) => void
  hasError?: boolean
  children: React.ReactNode
  handle?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  cardRef?: (el: HTMLDivElement | null) => void
}

export function SectionCard({
  title,
  description,
  position,
  locked,
  visible = true,
  onVisibleChange,
  hasError,
  children,
  handle,
  className,
  style,
  cardRef,
}: CardProps) {
  const [open, setOpen] = useState(false)
  return (
    <Card ref={cardRef} style={style} className={cn("gap-0 py-0", !visible && "bg-muted/40", hasError && "border-destructive", className)}>
      <Collapsible open={open || !!hasError} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 py-3 pr-3 pl-2">
          {locked ? (
            <span className="flex size-8 items-center justify-center text-muted-foreground" title="Fixed position">
              <Lock className="size-4" />
            </span>
          ) : (
            handle
          )}
          <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {position && <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">{position}</span>}
            <span className="grid min-w-0">
              <span className={cn("truncate font-medium", !visible && "text-muted-foreground")}>{title}</span>
              <span className="truncate text-xs text-muted-foreground">{description}</span>
            </span>
          </CollapsibleTrigger>
          {locked && <Badge variant="secondary">Fixed</Badge>}
          {!locked && !visible && (
            <Badge variant="outline" className="gap-1">
              <EyeOff className="size-3" /> Hidden
            </Badge>
          )}
          {hasError && <Badge variant="destructive">Needs fixing</Badge>}
          {!locked && onVisibleChange && (
            <Switch checked={visible} onCheckedChange={onVisibleChange} aria-label={`Show ${title} on the website`} />
          )}
          <CollapsibleTrigger
            aria-label={open ? `Collapse ${title}` : `Edit ${title}`}
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <ChevronDown className={cn("size-4 transition-transform", (open || hasError) && "rotate-180")} />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="grid gap-5 border-t px-4 py-5 sm:px-6">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function SortableItem({ id, ...props }: Omit<CardProps, "handle" | "cardRef" | "style"> & { id: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <SectionCard
      {...props}
      cardRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 shadow-lg ring-2 ring-ring/40")}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${props.title}`}
          className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      }
    />
  )
}

export type SortableSection = Omit<CardProps, "handle" | "cardRef" | "style" | "locked"> & { id: string }

/** Drag-and-drop (mouse, touch or keyboard: focus a handle, Space, arrows, Space). */
export function SortableSections({ items, onReorder }: { items: SortableSection[]; onReorder: (ids: string[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map((i) => i.id)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }
  return (
    <DndContext
      id="section-order"
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {items.map((item) => (
            <SortableItem key={item.id} {...item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
