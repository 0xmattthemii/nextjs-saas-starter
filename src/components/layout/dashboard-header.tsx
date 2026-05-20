'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { Fragment } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Top bar with the sidebar trigger and a path-derived breadcrumb. Pages that
 * need richer breadcrumbs (e.g. with a resource name) can render their own.
 */
export function DashboardHeader() {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <Fragment key={c.href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={c.href}>{c.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator /> : null}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function buildCrumbs(pathname: string): Array<{ label: string; href: Route }> {
  if (pathname === '/') return [{ label: 'Dashboard', href: '/' as Route }]
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Array<{ label: string; href: Route }> = [
    { label: 'Dashboard', href: '/' as Route },
  ]
  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    crumbs.push({ label: prettify(seg), href: acc as Route })
  }
  return crumbs
}

function prettify(segment: string): string {
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return 'Detail'
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}
