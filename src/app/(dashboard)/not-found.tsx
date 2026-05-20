import Link from 'next/link'
import { Button } from '@/components/ui/button'

/** Renders inside the dashboard shell when a child route calls notFound(). */
export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h2 className="text-2xl font-semibold tracking-tight">Not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The resource you tried to open doesn&apos;t exist in this workspace, or you don&apos;t have access.
      </p>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  )
}
