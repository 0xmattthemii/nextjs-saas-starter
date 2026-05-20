# Next.js SaaS Starter

A production-grade Next.js 16 starter for multi-tenant SaaS apps. Opinionated, lean, no boilerplate you'll regret.

- **Next.js 16** App Router, Turbopack, typed routes, React 19
- **shadcn/ui** + **Tailwind CSS v4** with light/dark/system themes
- **Better Auth** with email/password, Google OAuth, and the organization plugin (multi-tenant out of the box)
- **Drizzle ORM** + **Postgres** — works with any provider via `DATABASE_URL`
- **AI SDK 6** streaming chat via Vercel AI Gateway
- Inset sidebar shell, three example pages, per-route loading skeletons
- Account & organization settings, member invites, workspace switcher
- `AGENTS.md` tuned for AI-assisted development — synced to Claude Code, Cursor, and Copilot

---

## Quick start

```bash
# 1. Install
bun install

# 2. Local Postgres (skip if you already have one)
docker compose up -d

# 3. Configure
cp .env.example .env.local
# At minimum set BETTER_AUTH_SECRET; DATABASE_URL already matches docker-compose.
echo "BETTER_AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local

# 4. Migrate
bun run db:push        # dev-only sync from schema → db

# 5. Run
bun run dev
```

Open `http://localhost:3000`, create an account, and you're in.

---

## Environment

| Var                                            | Required          | Purpose                                                 |
| ---------------------------------------------- | ----------------- | ------------------------------------------------------- |
| `DATABASE_URL`                                 | ✓                 | Any Postgres connection string                          |
| `BETTER_AUTH_SECRET`                           | ✓                 | `openssl rand -base64 32`                               |
| `BETTER_AUTH_URL`                              | prod              | Public origin (auto-inferred in dev)                    |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`    | optional          | Enables Google sign-in button                           |
| `AI_GATEWAY_API_KEY`                           | optional          | Enables the /chat example (Vercel AI Gateway)           |

OAuth redirect URI for Google: `https://YOUR_HOST/api/auth/callback/google`.

---

## What's included

### Routes

- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` — auth flow with optional Google OAuth
- `/` — dashboard home
- `/items` (+ `/items/[id]` + `/items/new`) — example multi-tenant CRUD
- `/chat` — AI streaming chat
- `/settings/account` — name + password
- `/settings/organization` — rename workspace, manage members, create new workspaces

### Architecture decisions

- **Server-first.** Reads happen in Server Components; mutations in Server Actions; route handlers only for streaming/webhooks.
- **Multi-tenancy at the data layer.** Every tenant-owned row has `organizationId`; every query filters on it. The `requireActiveOrg()` helper gives you the id from the session — never trust user input for it.
- **Provider-agnostic Postgres.** No Supabase / Neon / RDS lock-in. Swap providers by changing `DATABASE_URL`.
- **Isolated loading states.** Each route ships its own `loading.tsx` so sibling navigation doesn't flash the wrong skeleton.
- **Typed routes.** Broken `<Link>` destinations fail at build time.

---

## Scripts

```bash
bun run dev          # dev server (Turbopack)
bun run build        # production build
bun run start        # production server
bun run lint         # ESLint
bun run typecheck    # tsc --noEmit
bun run db:generate  # create migration from schema diff
bun run db:migrate   # apply pending migrations
bun run db:push      # sync schema without a migration (dev only)
bun run db:studio    # Drizzle Studio UI
```

---

## Customizing

- **Brand the auth pages** — edit `src/app/(auth)/layout.tsx`.
- **Add a sidebar entry** — `src/components/layout/app-sidebar.tsx`.
- **Change the AI model** — `src/app/api/chat/route.ts` (constant at the top).
- **Send real emails** — wire `sendResetPassword` and `sendInvitationEmail` in `src/lib/auth/auth.ts`.
- **Add another social provider** — see [AGENTS.md](./AGENTS.md) "Common tasks".

The starter intentionally stops short of:

- Email delivery (pick your provider)
- Billing (Stripe / LemonSqueezy / Polar — pick yours)
- Analytics (Vercel Web Analytics is one line in the layout when you want it)

These are opinionated, app-specific choices; the starter stays unopinionated so you don't fight the defaults.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import it on Vercel (`https://vercel.com/new`) — accept the defaults; Bun and Next.js 16 are detected automatically.
3. Provision a Postgres database (Vercel Marketplace → Neon, Supabase, etc.). Vercel injects `DATABASE_URL` automatically.
4. Add `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`) and `BETTER_AUTH_URL` (your production origin) under Settings → Environment Variables.
5. Optional: add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and `AI_GATEWAY_API_KEY`.
6. Run `bun run db:push` once against the production DB (locally, with `DATABASE_URL` pointed at production) — or wire `db:migrate` into your CI.

The Vercel AI Gateway is the recommended way to power the `/chat` example in production — one key, any provider, with automatic failover and cost tracking.

---

## Working with AI assistants

[`AGENTS.md`](./AGENTS.md) is the canonical brief for AI tools: architecture, conventions, common tasks, and explicit do/don't rules. The repo ships pre-synced copies for the major tools:

| Tool                   | File read at session start              |
| ---------------------- | --------------------------------------- |
| Canonical              | `AGENTS.md`                             |
| Claude Code            | `CLAUDE.md`                             |
| Cursor (legacy rules)  | `.cursorrules`                          |
| GitHub Copilot         | `.github/copilot-instructions.md`       |

**Edit `AGENTS.md`, then run `bun run agents:sync`** — the script regenerates all the shims with a "do not edit by hand" banner. Add another tool? Add an entry to `scripts/sync-agents.mjs`.

If your tool isn't listed, point it at `AGENTS.md` directly — the content is tool-agnostic.

---

## License

MIT — do what you want, no warranty.
