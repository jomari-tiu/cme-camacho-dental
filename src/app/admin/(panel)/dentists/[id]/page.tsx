import { Suspense } from "react"
import { DentistEditorRoute } from "@/components/admin/dentist-editor"

// The editor reads its id and content in the browser, so there is nothing to prerender.
export const instant = false

export default function DentistEditPage() {
  return (
    <Suspense>
      <DentistEditorRoute />
    </Suspense>
  )
}
