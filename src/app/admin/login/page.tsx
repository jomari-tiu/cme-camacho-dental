"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, useSession } from "@/lib/auth"
import { useCms } from "@/lib/cms-store"

function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next")
  return next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin"
}

export default function LoginPage() {
  const router = useRouter()
  const session = useSession()
  const { content } = useCms()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session) router.replace(nextPath())
  }, [session, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    const result = await login(email, password)
    if (result.ok) router.replace(nextPath())
    else {
      setError(result.error)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={submit} className="grid gap-6">
          <CardHeader className="grid justify-items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.brand.logoNav} alt={content.brand.name} className="h-10 w-auto" />
            <div className="grid gap-1">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Clinic admin and dentist accounts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="grid gap-3">
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">Dentists: ask the clinic admin for an account.</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
