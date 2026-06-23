import type { ZodError } from 'zod'

/**
 * Flatten a ZodError into a { field: message } map for inline form errors.
 * Keeps the first message per top-level field — enough for these forms.
 */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in out)) out[key] = issue.message
  }
  return out
}
