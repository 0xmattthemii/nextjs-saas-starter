'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs: Array<{ href: Route; label: string }> = [
  { href: '/settings/account', label: 'Account' },
  { href: '/settings/organization', label: 'Organization' },
]

// Route-based tabs: the shadcn Tabs styling shows the active tab, while each
// trigger is a real <Link> so navigation still drives the URL.
export function SettingsTabs() {
  const pathname = usePathname()
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0].href

  return (
    <Tabs value={active}>
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.href} value={t.href} asChild>
            <Link href={t.href}>{t.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
