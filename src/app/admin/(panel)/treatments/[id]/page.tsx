import { Suspense } from "react"
import { TreatmentEditor } from "./editor"

// The editor reads its id and content in the browser, so there is nothing to prerender.
export const instant = false

export default function TreatmentEditPage() {
  return (
    <Suspense>
      <TreatmentEditor />
    </Suspense>
  )
}
