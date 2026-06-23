import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { items } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata = { title: 'Items' }

// The shell (heading + "New item") renders instantly; only the table streams.
export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <header className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Items</h1>
          <p className="text-muted-foreground">
            An example resource scoped to your active workspace.
          </p>
        </header>
        <Button asChild>
          <Link href="/items/new">
            <Plus className="size-4" /> New item
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ItemsTableSkeleton />}>
        <ItemsList />
      </Suspense>
    </div>
  )
}

async function ItemsList() {
  const { orgId } = await requireActiveOrg()
  const rows = await db
    .select()
    .from(items)
    .where(eq(items.organizationId, orgId))
    .orderBy(desc(items.createdAt))

  if (rows.length === 0) return <EmptyState />

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-44">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/items/${item.id}`} className="hover:underline">
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Mirrors the table: a header row + body rows, built from plain Skeleton blocks.
function ItemsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="h-4 max-w-sm flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed py-12 text-center">
      <h3 className="text-base font-medium">No items yet</h3>
      <p className="text-sm text-muted-foreground">Create your first item to see it here.</p>
      <Button asChild className="mt-4">
        <Link href="/items/new">
          <Plus className="size-4" /> New item
        </Link>
      </Button>
    </div>
  )
}
