import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic dashboard-shell loading skeleton.
 *
 * Renders during any sibling navigation that doesn't have its own loading.tsx.
 * Deliberately content-agnostic — a specific page's skeleton (e.g. an items
 * table) lives in that page's own loading.tsx so we never flash the wrong
 * shape during navigation between routes.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
