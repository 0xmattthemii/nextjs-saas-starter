'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { ListTodo, MessagesSquare, LayoutDashboard, Settings, type LucideIcon } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { OrgSwitcher } from './org-switcher'
import { UserMenu } from './user-menu'

const navigation: Array<{ name: string; href: Route; icon: LucideIcon }> = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Items', href: '/items', icon: ListTodo },
  { name: 'Chat', href: '/chat', icon: MessagesSquare },
]

const settings: Array<{ name: string; href: Route; icon: LucideIcon }> = [
  { name: 'Settings', href: '/settings/account', icon: Settings },
]

type Org = { id: string; name: string; slug: string; logo: string | null }

export function AppSidebar({
  user,
  orgs,
  activeOrgId,
}: {
  user: { id: string; name: string; email: string; image: string | null }
  orgs: Org[]
  activeOrgId: string
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settings.map((item) => {
                const active = pathname.startsWith('/settings')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
