import { requireSession } from '@/lib/auth/session'
import { AccountForm } from '@/components/settings/account-form'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Account settings' }

export default async function AccountSettingsPage() {
  const session = await requireSession()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update how others see you.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm
            defaultValues={{ name: session.user.name, email: session.user.email }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Pick something only you would know.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
