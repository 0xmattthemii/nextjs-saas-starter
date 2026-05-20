<!--
  Generated from AGENTS.md — do not edit by hand.
  Run `bun run agents:sync` after editing AGENTS.md to regenerate.
  Tool target: Claude Code.
-->

# Agent Instructions

> **Canonical source.** This file is the single source of truth for AI-assisted development.
> Tool-specific copies (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) are
> generated from this one — edit `AGENTS.md`, then run `bun run agents:sync`.

You are working in a **Next.js 16 SaaS starter** built around five non-negotiables:

1. **App Router + RSC by default.** Server Components for data, Client Components only at the leaves.
2. **Multi-tenancy is enforced at the data layer.** Every row that belongs to a workspace MUST be filtered by `organizationId` in every query — no exceptions.
3. **Typed routes are on.** `<Link href>` and `router.push()` only accept routes that exist. Cast user-supplied paths via `safeNextPath()`.
4. **Loading skeletons match their page.** Each route owns its own `loading.tsx` so navigation never shows the wrong shape.
5. **Server Actions for mutations, Server Components for reads.** Route handlers are reserved for things actions can't do (streaming, webhooks, third-party callbacks).

Read this file end-to-end before writing code. The patterns below are load-bearing.

---

## Stack

| Layer       | Choice                                           |
| ----------- | ------------------------------------------------ |
| Runtime     | Bun (`bun --bun next dev`)                       |
| Framework   | Next.js 16 (App Router, Turbopack, typed routes) |
| UI          | shadcn/ui + Tailwind CSS v4 + `tw-animate-css`   |
| Auth        | Better Auth 1.6+ with organization plugin        |
| Database    | Postgres via `DATABASE_URL` (provider-agnostic)  |
| ORM         | Drizzle ORM (`pg` driver)                        |
| Validation  | Zod 4                                            |
| Forms       | react-hook-form + `@hookform/resolvers`          |
| AI          | Vercel AI SDK 6 via AI Gateway                   |
| Theme       | `next-themes` (system / light / dark)            |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/                  → public auth routes (sign-in, sign-up, password reset)
│   │   ├── layout.tsx           → split-screen layout
│   │   └── …/page.tsx
│   ├── (dashboard)/             → authenticated app
│   │   ├── layout.tsx           → SidebarProvider + auto-create personal org
│   │   ├── loading.tsx          → GENERIC fallback (never page-specific)
│   │   ├── page.tsx             → dashboard home at "/"
│   │   ├── items/               → example CRUD resource
│   │   ├── chat/                → example AI streaming page
│   │   └── settings/            → account & organization
│   ├── api/
│   │   ├── auth/[...all]/route.ts  → Better Auth catch-all
│   │   └── chat/route.ts            → AI SDK streaming endpoint
│   ├── globals.css              → Tailwind v4 + shadcn theme tokens
│   └── layout.tsx               → root: ThemeProvider, TooltipProvider, Toaster
├── components/
│   ├── ui/                      → shadcn primitives (managed by shadcn CLI)
│   ├── layout/                  → sidebar, header, org switcher, user menu
│   ├── auth/                    → forms for the (auth) routes
│   ├── items/                   → item-form, item-row-actions
│   ├── chat/                    → useChat client
│   ├── settings/                → forms for /settings
│   └── skeletons/               → reusable skeleton fragments (if any)
├── db/
│   ├── index.ts                 → singleton pg Pool + Drizzle wrapper
│   └── schema/                  → one file per table-group, re-exported via index.ts
├── lib/
│   ├── auth/                    → auth.ts, auth-client.ts, session.ts, redirects.ts
│   ├── actions/                 → server actions ("use server")
│   ├── validators/              → Zod schemas reused between actions and forms
│   └── utils.ts                 → cn(), small helpers
├── hooks/                       → custom React hooks (use-mobile from shadcn)
└── proxy.ts                     → Next.js 16 proxy (renamed from middleware.ts)
```

---

## Auth model

- **Server Components / Server Actions** read the session with helpers from `@/lib/auth/session`:
  - `getSession()` — returns the session or `null` (cached per-request via `React.cache`).
  - `requireSession()` — same, but redirects to `/sign-in` when no user. Returns a typed non-null session.
  - `requireActiveOrg()` — same plus the active `orgId`. Use this on every page that touches tenant-owned data.
- **Client Components** use `authClient` from `@/lib/auth/auth-client` (the React client) for sign-in, sign-out, org operations, user updates, etc.
- **Proxy** (`src/proxy.ts`) checks for the session cookie only. Full validation happens in the dashboard layout. Don't add DB round-trips at the proxy layer.
- The dashboard layout **auto-creates a personal workspace** for first-time users. After that, the active org is read from `session.session.activeOrganizationId`.

### When you add a new authenticated page

```tsx
import { requireActiveOrg } from '@/lib/auth/session'

export default async function MyPage() {
  const { session, orgId } = await requireActiveOrg()
  // every query that follows MUST filter by orgId
}
```

---

## Multi-tenancy rule (load-bearing)

Every table that holds tenant-owned data has an `organization_id` FK. **Every query must filter on it**, including in joins. Pattern:

```ts
await db
  .select()
  .from(items)
  .where(and(eq(items.id, id), eq(items.organizationId, orgId)))
```

In server actions, the `orgId` always comes from `requireActiveOrg()` — never from `formData` or the URL. If you find yourself reading an org id from user input, stop and ask why.

---

## Mutations: server actions, not route handlers

- **Reads** → Server Component fetching directly from the DB.
- **Mutations** → Server Action in `src/lib/actions/<resource>.ts`.
- **Streaming / webhooks / third-party callbacks** → route handler in `src/app/api/…`.

Server actions in this repo follow one shape:

```ts
'use server'
export async function updateItem(id: string, formData: FormData): Promise<void> {
  const { orgId } = await requireActiveOrg()
  const parsed = itemInputSchema.safeParse({ /* … */ })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input')

  await db.update(items).set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.organizationId, orgId)))

  revalidatePath(`/items/${id}`)
  revalidatePath('/items')
}
```

Bind the id with `action.bind(null, id)` on the server, pass it to a client form. The client form calls the action with `formData` via `<form action={action}>`.

---

## Loading skeletons (per-route)

Next.js bubbles up the nearest `loading.tsx` during a `<Link>` navigation. Without per-route files, you'll see the wrong skeleton flash on the new page.

- `src/app/(dashboard)/loading.tsx` is **generic** — never copies a child's layout.
- Every route with non-trivial data fetching has its own `loading.tsx` that mirrors the page's shape (table, form, chat shell, etc).

When you add a new page, **always ship a matching `loading.tsx`** unless the page has no data fetching.

---

## Typed routes

`typedRoutes: true` is enabled in `next.config.ts`. Consequences:

- `<Link href="/items">` works because `/items` is a real route.
- `<Link href={someString}>` fails — annotate the variable as `Route` from `next` and ensure the value is a known literal.
- For user-supplied paths (URL params, redirects), validate then cast: `safeNextPath(raw)` returns `Route`.
- For an array of internal routes, type it as `Array<{ href: Route; ... }>` so TS checks each literal at definition time.

---

## Drizzle workflow

- Schemas live in `src/db/schema/`. Add a new table → create `<resource>.ts` and re-export from `src/db/schema/index.ts`.
- Run `bun run db:generate` to create a new migration SQL file in `drizzle/`.
- Run `bun run db:migrate` to apply it. In dev you can use `bun run db:push` to sync schema without migrations.
- The shared pool is exposed as `pool` from `@/db` for code that needs raw SQL (Better Auth tables, rare advanced queries). Everything else uses the `db` Drizzle wrapper.
- We use `casing: 'snake_case'` — write camelCase in code, columns are snake_case in SQL.

---

## AI chat (AI SDK 6)

- Server: `src/app/api/chat/route.ts` — uses `streamText` + `convertToModelMessages` + `toUIMessageStreamResponse`.
- Client: `src/components/chat/chat.tsx` — uses `useChat` from `@ai-sdk/react`, iterates `message.parts` switching on `part.type`.
- Default model is a string reference: `'anthropic/claude-sonnet-4.6'`, routed through Vercel AI Gateway (one key, any provider).
- To switch models, change the string: `'openai/gpt-5.4'`, `'google/gemini-2.5-pro'`, etc. The string form routes through the gateway and gives you failover, cost tracking, and observability automatically.
- Use a direct provider package (e.g. `@ai-sdk/openai`) only when you need a feature the gateway doesn't expose — and document why.
- **Never** trust your memory of AI SDK APIs. Before changing the chat code, read `node_modules/ai/docs/` — the SDK moves fast.

---

## Shadcn UI

- Style: **new-york**, neutral base, CSS variables.
- Add a component: `bunx --bun shadcn@latest add <name>`. Don't hand-roll primitives.
- The `Sidebar` family is wired up. New nav items go in `src/components/layout/app-sidebar.tsx`.
- `TooltipProvider` is at the root — `Tooltip` works anywhere.
- Toasts come from `sonner` via `<Toaster />` in `app/layout.tsx`. Import `toast` from `'sonner'`.

---

## Conventions

- **Imports**: `@/*` is `src/*`. Always use the alias, never relative paths across folders.
- **Files**: kebab-case (`item-form.tsx`, `user-menu.tsx`). React components are PascalCase exports.
- **Forms**: react-hook-form + zodResolver. Server-side, re-validate with the same Zod schema imported from `src/lib/validators/`.
- **Comments**: skip them by default. Only write a comment when the *why* is non-obvious (invariant, gotcha, deliberate workaround). Don't restate what the code already shows.
- **Errors at boundaries**: throw from server actions (with a message); the client form catches and toasts.
- **Theming**: don't add new color tokens unless a shadcn component needs them. Stick to the existing `--primary` / `--muted` / `--destructive` / etc.

---

## Don't

- Don't query the DB without an `orgId` filter on tenant-owned tables.
- Don't add a `loading.tsx` that mimics a specific page in a parent route — keep it generic.
- Don't add route handlers for plain CRUD — use Server Actions.
- Don't bypass `requireSession()` / `requireActiveOrg()` and read the session manually unless you have a specific reason.
- Don't introduce vendor-specific code paths (Supabase, Vercel-only APIs, etc.) without a portable fallback. This is a portable starter — `DATABASE_URL` works with any Postgres.
- Don't write multi-line comment blocks or planning docs unless the user asked.
- Don't run `git push`, create PRs, or modify CI without explicit user instruction.

---

## Common tasks

### Add a new resource

1. Schema: create `src/db/schema/<resource>.ts`, re-export from `index.ts`. Include `organizationId` FK.
2. Migration: `bun run db:generate && bun run db:migrate`.
3. Validator: `src/lib/validators/<resource>.ts` with a Zod schema.
4. Actions: `src/lib/actions/<resource>.ts` with create/update/delete using `requireActiveOrg()`.
5. Pages: `src/app/(dashboard)/<resource>/page.tsx` (list), `[id]/page.tsx` (detail), `new/page.tsx` (create) + matching `loading.tsx` files.
6. Components: `src/components/<resource>/<resource>-form.tsx` for the form, plus row actions if needed.
7. Sidebar entry: add a `{ name, href, icon }` to `navigation` in `app-sidebar.tsx`.

### Add a social provider

1. Add env vars to `.env.example` and your local `.env.local`.
2. In `src/lib/auth/auth.ts`, add the provider under `socialProviders` (gate it on env presence so the button only shows when configured).
3. In `src/components/auth/sign-in-form.tsx` and `sign-up-form.tsx`, render a new branded button that calls `authClient.signIn.social({ provider: '…' })`.

### Switch the AI model

Open `src/app/api/chat/route.ts` and change `MODEL`. For AI Gateway, run
`curl -s https://ai-gateway.vercel.sh/v1/models | jq` to see what's current. For direct providers, install the package and import its client.

### Send real emails (org invites, password reset)

Better Auth has hooks (`sendResetPassword`, `sendInvitationEmail`). Wire them up in `src/lib/auth/auth.ts` to your provider of choice (Resend, Postmark, AWS SES…). The starter intentionally leaves this unconfigured.

---

## Verifying changes

After non-trivial changes run, in order:

```
bun run typecheck    # tsc --noEmit
bun run lint         # next lint
bun run build        # production build (catches typed-routes regressions)
```

If you change schema, also run `bun run db:generate` and inspect the generated SQL before committing.
