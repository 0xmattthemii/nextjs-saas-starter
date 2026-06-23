# Architecture

A one-page tour for humans. AI assistants read [`AGENTS.md`](../AGENTS.md) instead.

## Request lifecycle

```
Browser
  │
  ▼
proxy.ts                       checks session cookie, redirects to /sign-in if missing
  │
  ▼
(dashboard)/layout.tsx         requireSession() → auto-creates personal org → loads orgs list
  │
  ├─► AppSidebar               org switcher + nav (Client Component)
  └─► page.tsx                 Server Component: reads from db with orgId filter
        │
        ├─► <Form action={serverAction}>    Server Action mutates → revalidatePath
        └─► <Link href={typed-route}>       client navigation
```

## Data layer

- `pg.Pool` is created once per process (with HMR-safe singleton in dev).
- Drizzle wraps the pool with `casing: 'snake_case'`. Schema lives in `src/db/schema/`.
- Better Auth uses the **drizzleAdapter** so it shares the same connection pool and emits queries Drizzle understands.

```
src/db/schema/auth.ts          → user, session, account, verification          (Better Auth core)
src/db/schema/organization.ts  → organization, member, invitation              (Better Auth org plugin)
src/db/schema/items.ts         → items                                        (example resource)
```

## Auth flow

| Step              | Where it lives                            |
| ----------------- | ----------------------------------------- |
| Sign-in form      | `src/components/auth/sign-in-form.tsx`    |
| Client calls      | `authClient.signIn.email(...)` via `auth-client.ts` |
| HTTP endpoint     | `src/app/api/auth/[...all]/route.ts`      |
| Server handler    | Better Auth + `drizzleAdapter`            |
| Cookie middleware | `src/proxy.ts` (Next.js 16 proxy)         |
| Session read      | `requireSession()` from `src/lib/auth/session.ts` (React.cache) |

## Multi-tenancy

- Each user belongs to one or more **organizations** via the `member` table.
- The **active organization** is stored on the session row (`session.activeOrganizationId`).
- The dashboard layout creates a personal org for first-time users so the rest of the app always has an active org to work against.
- Every tenant-owned row has an `organizationId` FK with `ON DELETE CASCADE` — deleting an org wipes its data.
- The `requireActiveOrg()` helper is the single source of truth for the current org id in Server Components and Server Actions.

## AI chat

- `useChat` (client) → POSTs UIMessages to `/api/chat`.
- The route handler validates the session, converts to ModelMessages, calls `streamText`, and returns a UI message stream response.
- The model is a direct provider instance (`@ai-sdk/anthropic` by default, reading `ANTHROPIC_API_KEY`) — no gateway. Swap providers by changing the import + `MODEL` in the route.

## Theming

- `next-themes` + `class` attribute + `disableTransitionOnChange` to avoid flashes.
- Tailwind v4 with CSS variables. Tokens live in `globals.css`.
- shadcn/ui new-york style with neutral base.
