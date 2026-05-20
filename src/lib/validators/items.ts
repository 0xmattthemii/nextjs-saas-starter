import { z } from 'zod'

export const itemInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
})

export type ItemInput = z.infer<typeof itemInputSchema>
