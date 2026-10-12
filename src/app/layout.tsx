import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CmsProvider } from "@/lib/cms-store"
import { defaultContent } from "@/content/defaults"
import "./globals.css"

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500"] })
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: defaultContent.seo.title,
  description: defaultContent.seo.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}>
      <body>
        <CmsProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </CmsProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
