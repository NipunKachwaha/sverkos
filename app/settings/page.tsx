// app/settings/page.tsx
// Converted from Remix: routes/settings.tsx

import { SettingsContent } from '@/app/components/SettingsContent.client';

export function generateMetadata() {
  return { title: 'Settings | Sverkos' };
}

export default function SettingsPage() {
  return <SettingsContent />;
}