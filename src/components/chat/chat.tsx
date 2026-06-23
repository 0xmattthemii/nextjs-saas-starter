'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Send, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function Chat() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    sendMessage({ text })
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-lg border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
            Ask anything to get started. The assistant streams responses in real time.
          </p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
            {m.role !== 'user' ? (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
            ) : null}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3.5 py-2 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {m.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <p key={`${m.id}-${i}`} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  )
                }
                return null
              })}
            </div>
            {m.role === 'user' ? (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-4" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t bg-background p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Type a message — Shift+Enter for newline"
          rows={1}
          className="min-h-[2.5rem] max-h-40 resize-none"
          disabled={busy}
        />
        <Button type="submit" size="icon" loading={busy} disabled={!input.trim()}>
          {busy ? null : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  )
}
