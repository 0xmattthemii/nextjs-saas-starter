import { Skeleton } from '@/components/ui/skeleton'

export default function ItemDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  )
}
