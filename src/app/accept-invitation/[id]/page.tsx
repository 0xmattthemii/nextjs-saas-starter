import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { invitation, organization } from '@/db/schema'
import { requireSession } from '@/lib/auth/session'
import { AcceptInvitation } from '@/components/auth/accept-invitation'

export const metadata = { title: 'Accept invitation' }

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()
  const { id } = await params

  const [inv] = await db
    .select({
      id: invitation.id,
      role: invitation.role,
      status: invitation.status,
      orgId: invitation.organizationId,
      orgName: organization.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .where(eq(invitation.id, id))
    .limit(1)

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {!inv || inv.status !== 'pending' ? (
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold">Invitation not available</h1>
            <p className="text-sm text-muted-foreground">
              This invitation may have been cancelled, already used, or expired.
            </p>
          </div>
        ) : (
          <>
            <header className="space-y-1.5 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Join {inv.orgName}</h1>
              <p className="text-sm text-muted-foreground">
                You&apos;ve been invited to join as {inv.role ?? 'member'}.
              </p>
            </header>
            <AcceptInvitation
              invitationId={inv.id}
              organizationId={inv.orgId}
              orgName={inv.orgName}
            />
          </>
        )}
      </div>
    </main>
  )
}
