import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { requireSession } from '@/lib/auth/session'

export const maxDuration = 30

/**
 * AI SDK 6 streaming chat endpoint.
 *
 * Routes through Vercel AI Gateway by default (one key, any provider). Set
 * `AI_GATEWAY_API_KEY` in .env.local. To switch providers, install the
 * provider package (e.g. `@ai-sdk/openai`) and import it here instead of using
 * the string model reference.
 */
const MODEL = 'anthropic/claude-sonnet-4.6'

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
