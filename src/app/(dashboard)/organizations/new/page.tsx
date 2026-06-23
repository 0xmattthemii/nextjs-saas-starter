import { CreateOrgForm } from '@/components/settings/create-org-form'

export const metadata = { title: 'New workspace' }

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create a workspace</h1>
        <p className="text-muted-foreground">
          A separate environment with its own data and members. You&apos;ll switch to
          it once it&apos;s created.
        </p>
      </header>
      <CreateOrgForm />
    </div>
  )
}
