'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { authClient } from '@/lib/auth/auth-client'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { toast } from 'sonner'

type Org = { id: string; name: string; slug: string; logo: string | null }

export function OrgSwitcher({ orgs, activeOrgId }: { orgs: Org[]; activeOrgId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { isMobile } = useSidebar()
  const active = orgs.find((o) => o.id === activeOrgId) ?? orgs[0]

  function switchOrg(orgId: string) {
    if (orgId === activeOrgId) return
    startTransition(async () => {
      const { error } = await authClient.organization.setActive({ organizationId: orgId })
      if (error) {
        toast.error(error.message ?? 'Could not switch organization')
        return
      }
      // Server reads the active org from the session — refresh to re-fetch.
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={pending}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                {active.name.charAt(0).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{active.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {orgs.length === 1 ? 'Workspace' : `${orgs.length} workspaces`}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => switchOrg(org.id)}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background text-xs font-medium">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{org.name}</span>
                <Check
                  className={cn(
                    'ml-auto size-4',
                    org.id === activeOrgId ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/organizations/new">
                <Plus className="size-4" />
                Create workspace
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
