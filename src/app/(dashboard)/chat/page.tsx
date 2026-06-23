import { Chat } from '@/components/chat/chat'

export const metadata = { title: 'AI chat' }

export default function ChatPage() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY)
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">AI chat</h1>
        <p className="text-muted-foreground">
          Streaming chat on the open-source AI SDK — Anthropic Claude by default,
          swappable to any provider in one line.
        </p>
      </header>
      {configured ? (
        <Chat />
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm">
          <p className="font-medium">
            Set <code>ANTHROPIC_API_KEY</code> to use the chat.
          </p>
          <p className="text-muted-foreground">
            Get a key at{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              console.anthropic.com
            </a>
            , add it to <code>.env.local</code>, and restart the dev server. To use a
            different provider, swap the import in{' '}
            <code>src/app/api/chat/route.ts</code>.
          </p>
        </div>
      )}
    </div>
  )
}
