# C.M.E. Camacho Dental — website + CMS

Next.js 16 port of the Claude Design file (`design/index.html`, kept for reference) with a browser-based CMS at `/admin`.

```bash
npm install
cp .env.example .env.local   # optional: change the admin login
npm run dev                  # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

## What the CMS manages
| Admin page | Controls |
| --- | --- |
| Dashboard / Appointments | Requests from the booking form — status (new / confirmed / done / cancelled), notes, call/text, reschedule (date, exact time, dentist), delete |
| Calendar | Month and week views of requests by date, colour-coded by dentist; day panel with who's in; "Needs a date" list; click a request to confirm or reschedule (double bookings blocked, out-of-hours warned) |
| General & contact | Clinic name, 3 logos, phones, email, Messenger/Facebook, address, map, SEO title/description |
| Hero | Badge, headline, intro, button label, photo, card texts |
| Sections & layout | Drag-and-drop section order + show/hide per section (navigation and footer are fixed), nav links, footer links, every section's eyebrow/title/intro, supplies banner, schedule note, booking form copy and options |
| Treatments | Add / edit / duplicate / reorder / delete; details, steps, result photos |
| Dentists & hours | Profile, portrait, specialties, schedule colour, weekly hours (drive the live schedule) |
| FAQs | Add / edit / reorder / delete |
| Dentist accounts | Create logins linked to a dentist profile, edit, reset password, disable, delete |
| Message templates | SMS + email template per event (request received, confirmed, rescheduled, reminder, completed, cancelled): on/off, variables, live preview, SMS length counter, restore default; channel on/off, sender name, reply-to |
| Outbox | Every patient SMS/email prepared by the system: waiting / sent / failed / not sent, open in SMS or email app to send by hand, mark as sent, retry |
| Settings & backup | Export / import JSON backup, reset content, clear appointments |

## Patient notifications (SMS & email)
- Triggers: a new booking request, and status/schedule changes on an appointment (Confirmed, rescheduled, Done, Cancelled). The day-before reminder template is ready but needs a backend job.
- Only patients who tick the consent box on the booking form are messaged; others are logged as "Not sent".
- Delivery goes through `src/lib/notifications/transport.ts`. Without `NEXT_PUBLIC_NOTIFICATIONS_API_URL` messages wait in the Outbox. When it is set, each message is POSTed there as `{ id, channel, to, subject, body, event, appointmentId }` and the backend delivers it (e.g. Android SMS gateway with the clinic SIM, or an SMS/email provider).

## Roles
- **Clinic admin** — signs in with `NEXT_PUBLIC_ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_PASSWORD`; full access.
- **Dentist** — accounts created under *Dentist accounts*. A dentist sees only their dashboard, their appointment requests and calendar (plus requests with no preferred dentist; no delete) and *My profile & hours*. Disabling or deleting an account signs the dentist out immediately.

## How storage works (no backend yet)
- Content and appointments live in the browser's IndexedDB (`src/lib/storage.ts`). Edits are visible in **that browser only**; use **Settings → Export/Import** to move them.
- Uploaded images are resized and stored as data URLs.
- Open site tabs refresh automatically when you save in the admin.
- To add a backend later, implement the `StorageAdapter` interface in `src/lib/storage.ts` (e.g. fetch to an API) — nothing else needs to change.
- The login (`src/lib/auth.ts`) is a demo gate only: the admin credentials are in the client bundle, and dentist accounts (PBKDF2-hashed passwords) live in the browser. Move both to a server before going live.

## Structure
- `src/content/schema.ts` / `defaults.ts` — content model (zod) and the original design's content
- `src/components/site/*` — public one-page site
- `src/app/admin/*`, `src/components/admin/*` — CMS (shadcn/ui, Base UI flavour)
