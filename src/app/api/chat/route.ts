import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { requireSession } from '@/lib/auth/session'

export const maxDuration = 30

// Direct provider, no gateway — `@ai-sdk/anthropic` reads ANTHROPIC_API_KEY.
// Swap providers by installing another package (e.g. `bun add @ai-sdk/openai`)
// and changing the import + MODEL below; the `streamText` call is identical.
// Verify model ids/APIs against node_modules/ai/docs before changing.
const MODEL = anthropic('claude-sonnet-4-6')

const SYSTEM_PROMPT =
  'You are a helpful assistant inside a SaaS starter app. Be concise, friendly, and honest about what you do not know.'

export async function POST(req: Request) {
  await requireSession()

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
