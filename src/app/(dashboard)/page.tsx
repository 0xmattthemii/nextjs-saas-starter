import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight, ListTodo, MessagesSquare, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          A SaaS starter with auth, orgs, multi-tenant data, and an AI chat example.
          Start exploring the patterns below — each links to a working page.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ExampleCard
          href="/items"
          icon={ListTodo}
          title="Resource CRUD"
          description="Server-rendered list, detail page, edit form via server actions. Scoped to the active organization."
        />
        <ExampleCard
          href="/chat"
          icon={MessagesSquare}
          title="AI streaming chat"
          description="Vercel AI SDK 6 with streaming responses. Swap the model via env in seconds."
        />
        <ExampleCard
          href="/settings/account"
          icon={Settings}
          title="Account & org"
          description="Update your profile, change password, rename your organization, invite teammates."
        />
      </div>
    </div>
  )
}

function ExampleCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: Route
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-colors group-hover:border-foreground/20">
        <CardHeader>
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="flex items-center justify-between text-base">
            {title}
            <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  )
}
