import { Suspense } from 'react'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { invitation, member, organization, user } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { OrgGeneralForm } from '@/components/settings/org-general-form'
import { MembersList } from '@/components/settings/members-list'
import { InviteForm } from '@/components/settings/invite-form'
import { CreateOrgForm } from '@/components/settings/create-org-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Organization settings' }

// Each card's chrome (title + description) renders immediately. The two
// data-backed cards stream independently — the members list never blocks the
// general form, and vice versa.
export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const { new: showNew } = await searchParams

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
          <CardDescription>People with access to this workspace.</CardDescription>
        </CardHeader>
        <Suspense fallback={<MembersSkeleton />}>
          <MembersSection />
        </Suspense>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create a new workspace</CardTitle>
          <CardDescription>
            Start a separate environment with its own data and members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm defaultOpen={showNew === '1'} />
        </CardContent>
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
    .where(eq(invitation.organizationId, orgId))

  const currentRole = members.find((m) => m.userId === session.user.id)?.role ?? 'member'
  const canManage = currentRole === 'owner' || currentRole === 'admin'

  return (
    <CardContent className="space-y-6">
      <MembersList
        members={members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.name,
          email: m.email,
          image: m.image,
          role: m.role,
        }))}
        currentUserId={session.user.id}
        canManage={canManage}
      />
      {invitations.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Pending invitations</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {invitations.map((inv) => (
              <li key={inv.id}>
                {inv.email} — {inv.role ?? 'member'} ({inv.status})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canManage ? <InviteForm /> : null}
    </CardContent>
  )
}

// Mirrors the member rows: avatar circle + name/email lines + a role pill.
function MembersSkeleton() {
  return (
    <CardContent>
      <div className="divide-y rounded-md border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </CardContent>
  )
}
