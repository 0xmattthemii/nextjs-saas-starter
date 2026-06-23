'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { Button } from '@/components/ui/button'

export function GoogleButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      loading={loading}
      onClick={async () => {
        setLoading(true)
        const { error } = await authClient.signIn.social({
          provider: 'google',
          callbackURL: next || '/',
        })
        // On success the browser is redirected to Google; we only land here on error.
        if (error) {
          toast.error(error.message ?? 'Could not continue with Google')
          setLoading(false)
        }
      }}
    >
      {loading ? null : <GoogleIcon className="size-4" />}
      Continue with Google
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
