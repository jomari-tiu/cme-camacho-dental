"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Suspense, createContext, useContext, useEffect } from "react"
import {
  CalendarClock,
  CalendarDays,
  ExternalLink,
  MessageSquareText,
  Send,
  FileText,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Stethoscope,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Dentist } from "@/content/schema"
import { dentistCanAccess, logout, useSession, type Session } from "@/lib/auth"
import { readAccounts, useCms } from "@/lib/cms-store"
import { visibleAppointments } from "./use-visible-appointments"

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "appointments" | "outbox" }
type NavGroup = { label: string; items: NavItem[] }

const adminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/appointments", label: "Appointments", icon: CalendarClock, badge: "appointments" },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/general", label: "General & contact", icon: Store },
      { href: "/admin/hero", label: "Hero", icon: Sparkles },
      { href: "/admin/sections", label: "Sections & layout", icon: FileText },
      { href: "/admin/treatments", label: "Treatments", icon: Stethoscope },
      { href: "/admin/dentists", label: "Dentists & hours", icon: UserRound },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Messaging",
    items: [
      { href: "/admin/templates", label: "Message templates", icon: MessageSquareText },
      { href: "/admin/outbox", label: "Outbox", icon: Send, badge: "outbox" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/accounts", label: "Dentist accounts", icon: KeyRound },
      { href: "/admin/settings", label: "Settings & backup", icon: Settings },
    ],
  },
]

const dentistNav: NavGroup[] = [
  {
    label: "My practice",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/appointments", label: "My appointments", icon: CalendarClock, badge: "appointments" },
      { href: "/admin/calendar", label: "My calendar", icon: CalendarDays },
      { href: "/admin/my-profile", label: "My profile & hours", icon: UserRound },
    ],
  },
]

export type AdminUser = { session: Session; isAdmin: boolean; dentist: Dentist | null }
const AdminUserContext = createContext<AdminUser | null>(null)

/** The signed-in admin or dentist. Only available inside the admin panel. */
export function useAdminUser(): AdminUser {
  const ctx = useContext(AdminUserContext)
  if (!ctx) throw new Error("useAdminUser must be used inside <AdminShell>")
  return ctx
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const router = useRouter()
  const { content, accounts, appointments, outbox, ready, updateAccounts } = useCms()

  // A dentist account that was disabled or deleted loses access immediately.
  const account = session?.role === "dentist" ? accounts.find((a) => a.id === session.accountId) : undefined
  const revoked = ready && session?.role === "dentist" && (!account || !account.active)
  const dentist = session?.role === "dentist" ? (content.dentists.find((d) => d.id === session.dentistId) ?? null) : null

  useEffect(() => {
    if (!revoked || session?.role !== "dentist") return
    // Confirm against storage first: this tab's copy of the accounts may be stale, and
    // logging out clears the session for every open tab.
    let alive = true
    readAccounts().then((list) => {
      const fresh = list.find((a) => a.id === session.accountId)
      if (!alive) return
      if (!fresh || !fresh.active) logout()
      else updateAccounts((l) => l) // stale copy: reload it from storage
    })
    return () => {
      alive = false
    }
  }, [revoked, session, updateAccounts])

  useEffect(() => {
    if (session === null) router.replace("/admin/login?next=" + encodeURIComponent(window.location.pathname))
  }, [session, router])

  const signedIn = !!session && !revoked
  const nav = session?.role === "dentist" ? dentistNav : adminNav
  const user: AdminUser | null = session ? { session, isAdmin: session.role === "admin", dentist } : null
  const badges = {
    appointments: user ? visibleAppointments(appointments, user).filter((a) => a.status === "new").length : 0,
    outbox: outbox.filter((m) => m.status === "queued" || m.status === "failed").length,
  }

  // The shell always renders (so routes prerender), but stays hidden until the session is confirmed.
  return (
    <>
      {!signedIn && (
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}
      <SidebarProvider hidden={!signedIn} inert={!signedIn}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#161614] font-serif text-[11px] font-bold text-[#F3F1EC]">
                    CME
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{content.brand.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.role === "dentist" ? "Dentist portal" : "Website CMS"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <Suspense>
              <NavGroups groups={nav} badges={badges} />
            </Suspense>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="View website" render={<a href="/" target="_blank" rel="noreferrer" />}>
                  <ExternalLink />
                  <span>View website</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Log out"
                  onClick={() => {
                    logout()
                    router.replace("/admin/login")
                  }}
                >
                  <LogOut />
                  <span className="grid min-w-0 text-left leading-tight">
                    <span className="truncate">Log out</span>
                    <span className="truncate text-xs text-muted-foreground">{session?.email ?? ""}</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Suspense>
              <CurrentLabel groups={nav} />
            </Suspense>
          </header>
          <div className="flex-1">
            {user ? (
              <AdminUserContext.Provider value={user}>
                <Suspense>
                  <RoleGate>{children}</RoleGate>
                </Suspense>
              </AdminUserContext.Provider>
            ) : (
              // Rendered (hidden) before sign-in is confirmed so each route can prerender.
              <AdminUserContext.Provider value={GUEST}>{children}</AdminUserContext.Provider>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}

/** Placeholder user while the session is unknown (shell is hidden then). */
const GUEST: AdminUser = { session: { role: "admin", email: "", name: "" }, isAdmin: false, dentist: null }

/** Keeps dentists on their own pages and explains a missing dentist profile. */
function RoleGate({ children }: { children: React.ReactNode }) {
  const { session, dentist } = useAdminUser()
  const { ready } = useCms()
  const pathname = usePathname()
  const router = useRouter()
  const blocked = session.role === "dentist" && !dentistCanAccess(pathname)

  useEffect(() => {
    if (blocked) router.replace("/admin")
  }, [blocked, router])

  if (blocked) return null
  if (session.role === "dentist" && ready && !dentist) {
    return (
      <div className="mx-auto grid max-w-md gap-3 p-8 text-center">
        <h1 className="text-xl font-semibold">Your dentist profile was removed</h1>
        <p className="text-sm text-muted-foreground">Ask the clinic admin to link your account to a dentist profile.</p>
        <Button
          variant="outline"
          className="justify-self-center"
          onClick={() => {
            logout()
            router.replace("/admin/login")
          }}
        >
          Log out
        </Button>
      </div>
    )
  }
  return children
}

function useIsActive() {
  const pathname = usePathname()
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
}

function NavGroups({ groups, badges }: { groups: NavGroup[]; badges: Record<NonNullable<NavItem["badge"]>, number> }) {
  const isActive = useIsActive()
  return groups.map((g) => (
    <SidebarGroup key={g.label}>
      <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {g.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton isActive={isActive(item.href)} tooltip={item.label} render={<Link href={item.href} />}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {item.badge && badges[item.badge] > 0 && <SidebarMenuBadge>{badges[item.badge]}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

function CurrentLabel({ groups }: { groups: NavGroup[] }) {
  const isActive = useIsActive()
  return (
    <span className="text-sm text-muted-foreground">
      {groups.flatMap((g) => g.items).find((i) => isActive(i.href))?.label ?? "Admin"}
    </span>
  )
}
