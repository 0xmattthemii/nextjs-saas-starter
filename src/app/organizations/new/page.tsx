import { requireSession } from '@/lib/auth/session'
import { CreateOrgForm } from '@/components/settings/create-org-form'

export const metadata = { title: 'New workspace' }

// Top-level route (outside the (dashboard) shell) — no sidebar/topbar, so it's
// clear you're leaving the current org to create a new one.
export default async function NewOrganizationPage() {
  await requireSession()

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create a workspace</h1>
          <p className="text-sm text-muted-foreground">
            A separate environment with its own data and members. You&apos;ll switch
            to it once it&apos;s created.
          </p>
        </header>
        <CreateOrgForm />
      </div>
    </main>
  )
}
