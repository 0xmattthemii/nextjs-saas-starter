import { Chat } from '@/components/chat/chat'

export const metadata = { title: 'AI chat' }

export default function ChatPage() {
  const configured = Boolean(process.env.AI_GATEWAY_API_KEY)
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">AI chat</h1>
        <p className="text-muted-foreground">
          Streaming chat powered by Vercel AI SDK 6 — Anthropic Claude via AI Gateway by default.
        </p>
      </header>
      {configured ? (
        <Chat />
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm">
          <p className="font-medium">Set <code>AI_GATEWAY_API_KEY</code> to use the chat.</p>
          <p className="text-muted-foreground">
            Get a key at{' '}
            <a
              href="https://vercel.com/ai-gateway"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              vercel.com/ai-gateway
            </a>
            , add it to <code>.env.local</code>, and restart the dev server.
          </p>
        </div>
      )}
    </div>
  )
}
