import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organization, user } from './auth'

/**
 * Example resource. Always scope tenant-owned rows by `organizationId` and
 * filter on it in every query — this is how multi-tenancy is enforced at the
 * data layer in this starter.
 */
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
