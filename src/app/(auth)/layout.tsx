import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-zinc-100">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="size-8 rounded-md bg-zinc-100 text-zinc-900 grid place-items-center font-bold">
            S
          </div>
          SaaS Starter
        </Link>
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;A solid SaaS foundation: auth, orgs, multi-tenant data, AI streaming.
            Replace the brand and ship.&rdquo;
          </p>
        </blockquote>
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
