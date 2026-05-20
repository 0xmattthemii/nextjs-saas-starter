'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type MemberRow = {
  id: string
  userId: string
  name: string
  email: string
  image: string | null
  role: string
}

export function MembersList({
  members,
  currentUserId,
  canManage,
}: {
  members: MemberRow[]
  currentUserId: string
  canManage: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function removeMember(memberId: string) {
    if (!confirm('Remove this member from the workspace?')) return
    startTransition(async () => {
      const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId })
      if (error) {
        toast.error(error.message ?? 'Could not remove member')
        return
      }
      toast.success('Member removed')
      router.refresh()
    })
  }

  return (
    <ul className="divide-y rounded-md border">
      {members.map((m) => {
        const initials =
          m.name
            ?.split(' ')
            .map((s) => s.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase() || m.email.charAt(0).toUpperCase()
        const isSelf = m.userId === currentUserId
        return (
          <li key={m.id} className="flex items-center gap-3 px-3 py-2">
            <Avatar className="size-8">
              {m.image ? <AvatarImage src={m.image} alt="" /> : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {m.name || m.email}
                {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
              </div>
              <div className="text-xs text-muted-foreground truncate">{m.email}</div>
            </div>
            <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>{m.role}</Badge>
            {canManage && !isSelf && m.role !== 'owner' ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => removeMember(m.id)}
              >
                Remove
              </Button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
