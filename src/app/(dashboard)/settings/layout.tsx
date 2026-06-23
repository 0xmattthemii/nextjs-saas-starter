import { SettingsTabs } from '@/components/settings/settings-tabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace.</p>
      </header>
      <SettingsTabs />
      <div className="max-w-2xl">{children}</div>
    </div>
  )
}
