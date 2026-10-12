import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in · C.M.E. Camacho Dental",
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
