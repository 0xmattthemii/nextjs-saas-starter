import Link from 'next/link'
import type { Route } from 'next'

const tabs: Array<{ href: Route; label: string }> = [
  { href: '/settings/account', label: 'Account' },
  { href: '/settings/organization', label: 'Organization' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace.</p>
      </header>
      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="max-w-2xl">{children}</div>
    </div>
  )
}
