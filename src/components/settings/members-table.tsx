'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type MemberRow =
  | {
      type: 'member'
      id: string
      userId: string
      name: string
      email: string
      image: string | null
      role: string
    }
  | { type: 'invite'; id: string; email: string; role: string }

function initialsOf(value: string) {
  return (
    value
      .split(' ')
      .map((s) => s.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || value.charAt(0).toUpperCase()
  )
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function MembersTable({
  rows,
  currentUserId,
  canManage,
}: {
  rows: MemberRow[]
  currentUserId: string
  canManage: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function act(
    id: string,
    fn: () => Promise<{ error?: { message?: string } | null }>,
    success: string,
  ) {
    setBusyId(id)
    startTransition(async () => {
      const { error } = await fn()
      if (error) {
        toast.error(error.message ?? 'Something went wrong')
        setBusyId(null)
        return
      }
      toast.success(success)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="w-32">Role</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isMember = row.type === 'member'
            const isSelf = isMember && row.userId === currentUserId
            const isOwner = row.role === 'owner'
            const label = isMember ? row.name || row.email : row.email
            const roleEditable = canManage && isMember && !isSelf && !isOwner
            const busy = busyId === row.id
            const roleOptions = isOwner
              ? [{ value: 'owner', label: 'Owner' }]
              : isMember
                ? [
                    { value: 'admin', label: 'Admin' },
                    { value: 'member', label: 'Member' },
                  ]
                : [{ value: row.role, label: titleCase(row.role) }]
            const canRemove = canManage && isMember && !isSelf && !isOwner
            const canCancel = canManage && !isMember
            return (
              <TableRow key={`${row.type}-${row.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-7">
                      {isMember && row.image ? <AvatarImage src={row.image} alt="" /> : null}
                      <AvatarFallback className="text-xs">{initialsOf(label)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {label}
                          {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
                        </span>
                        {!isMember ? (
                          <Badge variant="secondary" className="font-normal">
                            Pending
                          </Badge>
                        ) : null}
                      </div>
                      {isMember && row.name ? (
                        <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <select
                    aria-label="Role"
                    value={row.role}
                    disabled={!roleEditable || busy}
                    onChange={(e) => {
                      const next = e.target.value
                      if (next === row.role) return
                      act(
                        row.id,
                        () =>
                          authClient.organization.updateMemberRole({
                            memberId: row.id,
                            role: next as 'admin' | 'member',
                          }),
                        'Role updated',
                      )
                    }}
                    className="h-8 w-28 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {roleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  {canRemove || canCancel ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" loading={busy} aria-label="Member actions">
                          {busy ? null : <MoreHorizontal className="size-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canRemove ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              act(
                                row.id,
                                () =>
                                  authClient.organization.removeMember({
                                    memberIdOrEmail: row.id,
                                  }),
                                'Member removed',
                              )
                            }
                          >
                            Remove from workspace
                          </DropdownMenuItem>
                        ) : null}
                        {canCancel ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              act(
                                row.id,
                                () =>
                                  authClient.organization.cancelInvitation({
                                    invitationId: row.id,
                                  }),
                                'Invitation cancelled',
                              )
                            }
                          >
                            Cancel invitation
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
