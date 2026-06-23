<!--
  Generated from AGENTS.md — do not edit by hand.
  Run `bun run agents:sync` after editing AGENTS.md to regenerate.
  Tool target: GitHub Copilot.
-->

# Agent Instructions

> **Canonical source.** This file is the single source of truth for AI-assisted development.
> Tool-specific copies (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) are
> generated from this one — edit `AGENTS.md`, then run `bun run agents:sync`.

You are working in a **Next.js 16 SaaS starter** built around six non-negotiables:

1. **App Router + RSC by default.** Server Components for data, Client Components only at the leaves.
2. **Multi-tenancy is enforced at the data layer.** Every row that belongs to a workspace MUST be filtered by `organizationId` in every query — no exceptions.
3. **Typed routes are on.** `<Link href>` and `router.push()` only accept routes that exist. Cast user-supplied paths via `safeNextPath()`.
4. **Loading is granular, never a bottleneck.** Wrap every async read in its own `<Suspense>` with a skeleton that mirrors the real shape. The static shell renders instantly and each section streams in independently — no single slow query blocks the page. No route-level `loading.tsx`.
5. **Server Actions for mutations, Server Components for reads.** Route handlers are reserved for things actions can't do (streaming, webhooks, third-party callbacks).
6. **Style with shadcn + Tailwind, never a hand-rolled theme.** shadcn components, Tailwind utilities, and the existing theme tokens only. Don't hand-edit `globals.css`/token values or add ad-hoc colors — see **Design & UX patterns**.

Read this file end-to-end before writing code. The patterns below are load-bearing.

---

## Stack

| Layer       | Choice                                           |
| ----------- | ------------------------------------------------ |
| Runtime     | Bun (`bun --bun next dev`)                       |
| Framework   | Next.js 16 (App Router, Turbopack, typed routes) |
| UI          | shadcn/ui (new-york) + Tailwind CSS v4           |
| Auth        | Better Auth 1.6+ with organization plugin        |
| Database    | Postgres via `DATABASE_URL` (provider-agnostic)  |
| ORM         | Drizzle ORM (`pg` driver)                        |
| Validation  | Zod 4                                            |
| Forms       | Native React 19 (Server Actions / `useTransition`) + Zod — no form library |
| AI          | AI SDK 6 (open-source) + direct provider package — no gateway, no lock-in |
| Theme       | `next-themes` (system / light / dark)            |

> The stack is deliberately **portable and lock-in free**: any Postgres via `DATABASE_URL`, any
> AI provider via a swappable `@ai-sdk/*` package, no proprietary SDKs on the critical path.
> shadcn also installs `tw-animate-css` (its Tailwind v4 animation utilities) into `globals.css` —
> that's expected, not an extra dependency to remove.

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
│   │   ├── page.tsx             → dashboard home at "/"  (no loading.tsx — pages stream via <Suspense>)
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
│   └── settings/                → forms for /settings
│                                  (skeletons are co-located with each data section as
│                                   <Suspense> fallbacks — see app/(dashboard)/items/page.tsx)
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

Actions **return** the data the client needs (e.g. the new row's id) and **don't `redirect()`** — the client toasts the outcome then navigates. See **Design & UX patterns → Toasts**.

---

## Forms

No form library. Forms are plain `<form>` + shadcn primitives + Zod, in one of two shapes:

**1. Server Action forms** — writes to our own DB (e.g. items). Bind the id server-side, submit the action directly, wrap in `useTransition` for pending state + error toasts:

```tsx
'use client'
const [pending, startTransition] = useTransition()
function onSubmit(formData: FormData) {
  startTransition(async () => {
    try {
      const result = await action(formData)   // returns; never redirects
      toast.success('Saved')
      if (result?.id) router.push(`/items/${result.id}`)
      else router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    }
  })
}
// <form action={onSubmit}>, uncontrolled <Input name="…" defaultValue={…} />,
// submit with <Button loading={pending}>Save</Button>
```

The server action re-validates with the same Zod schema (see **Mutations**) — client checks are UX, the server is the gate.

**2. Client SDK forms** — call Better Auth's `authClient` from the browser (sign-in, settings). Validate with Zod on submit; show inline field errors via the `fieldErrors()` helper in `src/lib/form.ts`:

```tsx
'use client'
function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)))
  if (!parsed.success) return setErrors(fieldErrors(parsed.error))
  startTransition(async () => {
    const { error } = await authClient.signIn.email({ ...parsed.data, callbackURL: '/' })
    if (error) return setServerError(error.message)
    router.push('/'); router.refresh()
  })
}
// <form onSubmit={onSubmit} noValidate> — uncontrolled inputs keep their values on error
```

Don't add `react-hook-form` back — these two patterns cover every form in the app. (`useActionState` is fine if you ever want progressive enhancement, but isn't needed for client-SDK forms.)

---

## Loading & streaming (granular Suspense)

Skeletons live at the **data**, not the route. A page renders its static shell synchronously, then wraps each async read in its own `<Suspense>` so sections stream in independently — a slow members query never holds up the workspace name beside it.

```tsx
// page.tsx — synchronous shell, no top-level await of slow data
export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <Header />                                {/* renders instantly */}
      <Suspense fallback={<ItemsTableSkeleton />}>
        <ItemsList />                           {/* async: requireActiveOrg() + db query */}
      </Suspense>
    </div>
  )
}

async function ItemsList() {
  const { orgId } = await requireActiveOrg()
  const rows = await db.select()...            // the slow part lives inside the boundary
  return <Table>…</Table>
}

function ItemsTableSkeleton() { /* Skeleton primitives shaped like the table */ }
```

Rules:

- **One boundary per independent read.** Two sections that fetch separately (workspace name vs. member list) get separate `<Suspense>` boundaries so neither waits on the other. See `settings/organization/page.tsx`.
- **Keep slow `await`s out of the page/layout body.** Anything awaited before the first `<Suspense>` blocks the whole subtree — push DB queries into the async child. Fast, request-cached reads (`requireActiveOrg()`, already resolved by the layout) are fine to await in the shell.
- **Skeletons mirror the real shape with primitives only.** Use the shadcn `Skeleton` (rectangles; add `rounded-full` for avatars/pills). Match the real wrapper classes and element counts so nothing shifts when data lands — co-locate the skeleton in the same file as the real markup so they stay in sync.
- **No `loading.tsx`.** A route-level `loading.tsx` is a single Suspense boundary around the entire page — exactly the bottleneck we're avoiding. Want a navigation indicator? Add a top progress bar in the layout, not a full-page skeleton.
- **No async data → no skeleton.** Static pages (dashboard home) and already-resolved reads don't need a boundary.

---

## Typed routes

`typedRoutes: true` is enabled in `next.config.ts`. Consequences:

- `<Link href="/items">` works because `/items` is a real route.
- `<Link href={someString}>` fails — annotate the variable as `Route` from `next` and ensure the value is a known literal.
- For user-supplied paths (URL params, redirects), validate then cast: `safeNextPath(raw)` returns `Route`.
- For an array of internal routes, type it as `Array<{ href: Route; ... }>` so TS checks each literal at definition time.

---

## Drizzle workflow

- **Schema has two sources of truth.** Better Auth's tables live in `src/db/schema/auth.ts`, which is **generated** from the auth config — never hand-edit it. Your own tables (e.g. `items.ts`) are hand-written; add `<resource>.ts` and re-export from `src/db/schema/index.ts`.
- Run `bun run db:generate` to create a new migration SQL file in `drizzle/` from the Drizzle schema. Filenames are **timestamped** (`migrations.prefix: 'timestamp'` in `drizzle.config.ts`) so parallel branches don't collide on a sequential number; apply order is tracked in `drizzle/meta/_journal.json`.
- Run `bun run db:migrate` to apply it. In dev you can use `bun run db:push` to sync schema without migrations.
- **Auth tables are config-driven.** After changing `src/lib/auth/auth.ts` (adding a plugin, `additionalFields`) or upgrading `better-auth`, run `bun run auth:generate` to regenerate `src/db/schema/auth.ts`, then `bun run db:generate && bun run db:migrate` like any other schema change. (`@better-auth/cli migrate` only supports Kysely, so migrations always go through Drizzle — one tool, one folder.)
- The shared pool is exposed as `pool` from `@/db` for code that needs raw SQL (Better Auth tables, rare advanced queries). Everything else uses the `db` Drizzle wrapper.
- We use `casing: 'snake_case'` — write camelCase in code, columns are snake_case in SQL.
- **Local dev login:** `bun run db:seed` creates an idempotent dev user (`dev@acme.test` / `password`) through Better Auth's server API, so you can sign in without registering or wiring real email. `bun run db:setup` = `db:migrate` + `db:seed` for first run. Seed lives in `src/db/seed.ts`; the personal workspace is auto-created on first sign-in.

---

## AI chat (AI SDK 6 — direct provider, no gateway)

The AI SDK is open-source and provider-agnostic; we use it **without** the Vercel AI Gateway to keep the starter free of vendor lock-in.

- Server: `src/app/api/chat/route.ts` — `streamText` + `convertToModelMessages` + `toUIMessageStreamResponse`.
- Client: `src/components/chat/chat.tsx` — `useChat` from `@ai-sdk/react`, iterates `message.parts` switching on `part.type`.
- The model is a **provider instance**, not a gateway string: `import { anthropic } from '@ai-sdk/anthropic'` → `const MODEL = anthropic('claude-sonnet-4-6')`. The provider reads `ANTHROPIC_API_KEY` from the environment.
- **Switch providers** by installing another package and swapping two lines — the `streamText` call is unchanged:
  - `bun add @ai-sdk/openai` → `import { openai } from '@ai-sdk/openai'` → `openai('gpt-5.1')` (set `OPENAI_API_KEY`)
  - `bun add @ai-sdk/google` → `import { google } from '@ai-sdk/google'` → `google('gemini-2.5-pro')` (set `GOOGLE_GENERATIVE_AI_API_KEY`)
- **Never** trust your memory of AI SDK APIs — they move fast. Read `node_modules/ai/docs/` and the provider's README under `node_modules/@ai-sdk/<provider>/` before changing the chat code, and confirm current model ids there.

---

## Shadcn UI

- Style: **new-york**, neutral base, CSS variables. Config in `components.json`.
- **Prefer native shadcn components over hand-rolled or third-party UI.** Add one with `bunx --bun shadcn@latest add <name>` — or, if the shadcn MCP server is connected, use it to browse and pull components. Don't reimplement primitives.
- `tw-animate-css` is imported in `globals.css` — it's shadcn's Tailwind v4 animation layer (successor to `tailwindcss-animate`). Leave it; components rely on it.
- We do **not** use shadcn's `Form` component (it pulls in react-hook-form). Compose forms from primitives (`Input`, `Label`, `Button`, `Textarea`, `select`) with the native pattern in **Forms**.
- The `Sidebar` family is wired up. New nav items go in `src/components/layout/app-sidebar.tsx`.
- `TooltipProvider` is at the root — `Tooltip` works anywhere.
- Toasts come from `sonner` via `<Toaster />` in `app/layout.tsx`. Import `toast` from `'sonner'`.
- Latest docs + component gallery: https://ui.shadcn.com/docs/components

---

## Design & UX patterns

House rules for how the UI looks and behaves. These are **conventions to follow when you add or change UI** — not a reason to refactor working code. Reach for shadcn + Tailwind to express them; don't reinvent.

### Styling: shadcn + Tailwind only

- Build UI from shadcn components and Tailwind utilities, using the **existing theme tokens** (`bg-card`, `bg-muted`, `text-muted-foreground`, `border`, `hover:bg-accent`, …).
- **Style with the existing theme tokens; don't add ad-hoc colors.** The neutral palette in `src/app/globals.css` is deliberately tuned so depth reads by color (`--sidebar` < `--background` < `--card`; see **Elevation**). If it must change, adjust the whole scale coherently across light **and** dark (or regenerate via shadcn theming) — never tweak one token in isolation.
- **No shadows.** Depth is expressed with the elevation tokens (color), never `shadow-*` utilities.
- Reach for a shadcn component before writing custom markup; add missing ones via the CLI (or the shadcn MCP).

### Elevation: depth reads darker

Surfaces stack from deep to close — deeper is darker, closer is lighter. Express it only with the existing tokens:

| Layer (deep → close)        | Token / class   |
| --------------------------- | --------------- |
| Page backdrop / sidebar     | `bg-sidebar`    |
| Content container           | `bg-background` |
| Card / panel on the content | `bg-card`       |
| Popover / dropdown / dialog | `bg-popover`    |
| Recessed / secondary fill   | `bg-muted`      |

- A card sits **on** its container, so it should read lighter than what's behind it — place `bg-card` on `bg-background`, not directly on another `bg-card`.
- The dashboard sidebar uses `variant="inset"`: the page backdrop + sidebar are `bg-sidebar` (deepest), the floating content panel is `bg-background`, and cards are `bg-card` (closest). The palette is tuned so this holds in light and dark.
- Keep a separator (border / gap) between same-token surfaces so the depth cue survives (no shadows).

### Hover: clickable things darken

Interactive elements darken on hover. shadcn buttons, dropdown/menu items, sidebar items and table rows already do (`hover:bg-accent` / `hover:bg-muted`). For a custom clickable surface add `transition-colors hover:bg-accent` (or `hover:bg-muted/50` for large tiles). In the sidebar a **selected** item reads darker than a hovered one — hover uses `sidebar-accent/50`, the active item the full `sidebar-accent`.

### Loading: every action shows a spinner

**Every** button that triggers an async action shows a spinner and is unclickable until it resolves — no double-submits, clear feedback. The shadcn `Button` takes a `loading` prop (renders the spinner + sets `disabled`); drive it from `useTransition`:

```tsx
const [pending, startTransition] = useTransition()

<Button loading={pending}>Save changes</Button>
```

For icon-only buttons, render the spinner in place of the icon:

```tsx
<Button size="icon" loading={busy} disabled={!input.trim()}>
  {busy ? null : <Send />}
</Button>
```

(This is button feedback — distinct from data-loading skeletons in **Loading & streaming**.)

### Toasts: every outcome, bottom-right

**Every** action outcome — success, error, and notable background completions — surfaces as a **toast**. No silent successes, no errors shown only inline. `<Toaster position="bottom-right" richColors closeButton />` is wired in `app/layout.tsx`; import `toast` from `sonner`.

- **Mutating server actions** mutate + `revalidatePath` and **return** the data the client needs — they do **not** `redirect()`. The client `try/catch`es the call, toasts `success`/`error`, then navigates (`router.push` / `router.refresh`). Redirecting from the action throws `NEXT_REDIRECT`, which the client `catch` would swallow as a fake error and skip the toast.
- **Client `authClient` calls** toast `error` on the returned `{ error }`, `success` on resolve.
- Toasts persist across client navigation (the `Toaster` lives in the root layout), so `toast.success(...)` → `router.push(...)` shows the toast on the destination page.
- Inline text under a field is for **pre-submit validation hints** only; the **result** of an action belongs in a toast.

---

## Conventions

- **Imports**: `@/*` is `src/*`. Always use the alias, never relative paths across folders.
- **Files**: kebab-case (`item-form.tsx`, `user-menu.tsx`). React components are PascalCase exports.
- **Forms**: no form library — see **Forms**. Validate with Zod on submit (`fieldErrors()` for inline messages); server actions re-validate with the same schema from `src/lib/validators/`.
- **Comments**: skip them by default. Only write a comment when the *why* is non-obvious (invariant, gotcha, deliberate workaround). Don't restate what the code already shows.
- **Errors at boundaries**: throw from server actions (with a message); the client form catches and toasts.
- **Theming**: don't hand-edit `globals.css` or theme token values — style with Tailwind utilities + the existing tokens, and regenerate the palette via shadcn theming if it must change. See **Design & UX patterns**.

---

## Don't

- Don't query the DB without an `orgId` filter on tenant-owned tables.
- Don't hand-edit `src/db/schema/auth.ts` — it's generated by `bun run auth:generate`. Add your own tables as separate files.
- Don't add `loading.tsx`, or `await` slow data above a `<Suspense>` — both bottleneck the whole page. Stream each section.
- Don't add a form library (react-hook-form, formik…) — use the native patterns in **Forms**.
- Don't add `shadow-*` utilities — depth is color-based (**Design & UX patterns → Elevation**).
- Don't change individual theme tokens ad-hoc or add new colors — adjust the palette as a coherent scale (**Design & UX patterns**).
- Don't add route handlers for plain CRUD — use Server Actions.
- Don't bypass `requireSession()` / `requireActiveOrg()` and read the session manually unless you have a specific reason.
- Don't introduce vendor lock-in (AI Gateway, Supabase-only APIs, Vercel-only runtime features…) without a portable fallback. `DATABASE_URL` works with any Postgres; AI runs through swappable `@ai-sdk/*` providers.
- Don't write multi-line comment blocks or planning docs unless the user asked.
- Don't run `git push`, create PRs, or modify CI without explicit user instruction.

---

## Common tasks

### Add a new resource

1. Schema: create `src/db/schema/<resource>.ts`, re-export from `index.ts`. Include `organizationId` FK.
2. Migration: `bun run db:generate && bun run db:migrate`.
3. Validator: `src/lib/validators/<resource>.ts` with a Zod schema.
4. Actions: `src/lib/actions/<resource>.ts` with create/update/delete using `requireActiveOrg()`.
5. Pages: `src/app/(dashboard)/<resource>/page.tsx` (list), `[id]/page.tsx` (detail), `new/page.tsx` (create). Render a static shell; put each DB read in an async child wrapped in `<Suspense>` with a co-located skeleton — no `loading.tsx`.
6. Components: `src/components/<resource>/<resource>-form.tsx` for the form, plus row actions if needed.
7. Sidebar entry: add a `{ name, href, icon }` to `navigation` in `app-sidebar.tsx`.

### Add a social provider

1. Add env vars to `.env.example` and your local `.env.local`.
2. In `src/lib/auth/auth.ts`, add the provider under `socialProviders` (gate it on env presence so the button only shows when configured).
3. In `src/components/auth/sign-in-form.tsx` and `sign-up-form.tsx`, render a new branded button that calls `authClient.signIn.social({ provider: '…' })`.

### Switch the AI model or provider

Open `src/app/api/chat/route.ts`. To change model: edit the `MODEL` constant (e.g. `anthropic('claude-opus-4-…')`). To change provider: `bun add @ai-sdk/<provider>`, swap the import, and set that provider's key in `.env.local` (see **AI chat**). Confirm model ids in the provider's docs — never guess them.

### Send real emails (org invites, password reset)

Better Auth has hooks (`sendResetPassword`, `sendInvitationEmail`). Wire them up in `src/lib/auth/auth.ts` to your provider of choice (Resend, Postmark, AWS SES…). The starter intentionally leaves this unconfigured.

---

## Docs / references

Check the current docs before using an API from memory — these move fast. (Offline: the AI SDK ships docs in `node_modules/ai/docs/`, and each `@ai-sdk/<provider>` package has a README.)

| Tool                                | Docs                                            |
| ----------------------------------- | ----------------------------------------------- |
| Next.js 16 (App Router)             | https://nextjs.org/docs                         |
| React 19                            | https://react.dev/reference/react               |
| shadcn/ui (components)              | https://ui.shadcn.com/docs/components           |
| Tailwind CSS v4                     | https://tailwindcss.com/docs                    |
| tw-animate-css                      | https://github.com/Wombosvideo/tw-animate-css   |
| Better Auth (+ organization plugin) | https://www.better-auth.com/docs                |
| Drizzle ORM                         | https://orm.drizzle.team/docs/overview          |
| Zod 4                               | https://zod.dev                                 |
| AI SDK 6                            | https://ai-sdk.dev/docs                         |
| AI SDK providers                    | https://ai-sdk.dev/providers/ai-sdk-providers   |
| next-themes                         | https://github.com/pacocoursey/next-themes      |
| lucide icons                        | https://lucide.dev/icons                        |
| sonner (toasts)                     | https://sonner.emilkowal.ski                    |
| node-postgres (`pg`)                | https://node-postgres.com                       |

---

## Verifying changes

After non-trivial changes run, in order:

```
bun run typecheck    # tsc --noEmit
bun run lint         # next lint
bun run build        # production build (catches typed-routes regressions)
```

If you change schema, also run `bun run db:generate` and inspect the generated SQL before committing.
