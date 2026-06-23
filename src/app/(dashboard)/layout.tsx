import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/db'
import { member, organization } from '@/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  const userId = session.user.id

  // First sign-in: every user gets a personal workspace so the app is usable
  // immediately. After auto-setup we MUST redirect — the session row in the
  // DB has activeOrganizationId set, but `requireSession()` is React.cache'd
  // for this render, so children would still see the stale (null) value and
  // bounce to /settings/organization. The redirect forces a fresh request.
  if (!session.session.activeOrganizationId) {
    const memberships = await db
      .select({ orgId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))
      .limit(1)

    if (memberships.length === 0) {
      const slugSuffix = crypto.randomUUID().slice(0, 8)
      const created = await auth.api.createOrganization({
        body: {
          name: `${session.user.name || session.user.email.split('@')[0]}'s workspace`,
          slug: `${userId.slice(0, 8)}-${slugSuffix}`,
        },
        headers: await headers(),
      })
      if (!created?.id) redirect('/sign-in?error=org_create_failed')
    } else {
      await auth.api.setActiveOrganization({
        body: { organizationId: memberships[0].orgId },
        headers: await headers(),
      })
    }
    redirect('/')
  }

  const activeOrgId = session.session.activeOrganizationId

  // The orgs list powers the sidebar switcher.
  const orgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    })
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId))
    .orderBy(organization.name)

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0]

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
        }}
        orgs={orgs}
        activeOrgId={activeOrg.id}
      />
      <SidebarInset className="overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
