import { Suspense } from 'react'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { invitation, member, organization, user } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { OrgGeneralForm } from '@/components/settings/org-general-form'
import { MembersTable, type MemberRow } from '@/components/settings/members-table'
import { InviteForm } from '@/components/settings/invite-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Organization settings' }

// Static shell; the two data-backed cards stream independently via <Suspense>.
export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Workspace name and slug.</CardDescription>
        </CardHeader>
        <Suspense fallback={<OrgGeneralSkeleton />}>
          <OrgGeneralSection />
        </Suspense>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People with access to this workspace, and pending invites.</CardDescription>
        </CardHeader>
        <Suspense fallback={<MembersSkeleton />}>
          <MembersSection />
        </Suspense>
      </Card>
    </div>
  )
}

async function OrgGeneralSection() {
  const { session, orgId } = await requireActiveOrg()
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)
  const [me] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)))
    .limit(1)
  const canManage = me?.role === 'owner' || me?.role === 'admin'

  return (
    <CardContent>
      <OrgGeneralForm
        org={{ id: org.id, name: org.name, slug: org.slug }}
        canManage={canManage}
      />
    </CardContent>
  )
}

function OrgGeneralSkeleton() {
  return (
    <CardContent className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-9 w-32" />
    </CardContent>
  )
}

async function MembersSection() {
  const { session, orgId } = await requireActiveOrg()

  const members = await db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, orgId))
    .orderBy(member.createdAt)

  const invitations = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.organizationId, orgId), eq(invitation.status, 'pending')))

  const currentRole = members.find((m) => m.userId === session.user.id)?.role ?? 'member'
  const canManage = currentRole === 'owner' || currentRole === 'admin'

  const rows: MemberRow[] = [
    ...members.map((m) => ({
      type: 'member' as const,
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      image: m.image,
      role: m.role,
    })),
    ...invitations.map((inv) => ({
      type: 'invite' as const,
      id: inv.id,
      email: inv.email,
      role: inv.role ?? 'member',
    })),
  ]

  return (
    <CardContent className="space-y-4">
      <MembersTable rows={rows} currentUserId={session.user.id} canManage={canManage} />
      {canManage ? <InviteForm /> : null}
    </CardContent>
  )
}

// Mirrors MembersTable: avatar + name/email, a role select, and the actions cell.
function MembersSkeleton() {
  return (
    <CardContent>
      <div className="rounded-md border">
        <div className="border-b px-3 py-2">
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        ))}
      </div>
    </CardContent>
  )
}
