import { ItemForm } from '@/components/items/item-form'
import { createItem } from '@/lib/actions/items'

export const metadata = { title: 'New item' }

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">New item</h1>
        <p className="text-muted-foreground">Add a new item to your workspace.</p>
      </header>
      <ItemForm action={createItem} submitLabel="Create item" />
    </div>
  )
}
