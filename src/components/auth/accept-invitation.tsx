'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { Button } from '@/components/ui/button'

export function AcceptInvitation({
  invitationId,
  organizationId,
  orgName,
}: {
  invitationId: string
  organizationId: string
  orgName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function accept() {
    startTransition(async () => {
      const { error } = await authClient.organization.acceptInvitation({ invitationId })
      if (error) {
        toast.error(error.message ?? 'Could not accept the invitation')
        return
      }
      await authClient.organization.setActive({ organizationId })
      toast.success(`Joined ${orgName}`)
      router.push('/')
      router.refresh()
    })
  }

  function decline() {
    startTransition(async () => {
      const { error } = await authClient.organization.rejectInvitation({ invitationId })
      if (error) {
        toast.error(error.message ?? 'Could not decline the invitation')
        return
      }
      toast.success('Invitation declined')
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className="flex justify-center gap-2">
      <Button onClick={accept} loading={pending}>
        Accept invitation
      </Button>
      <Button variant="ghost" onClick={decline} disabled={pending}>
        Decline
      </Button>
    </div>
  )
}
