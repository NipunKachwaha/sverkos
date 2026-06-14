// app/chat/page.tsx
// Converted from Remix: routes/_index.tsx
// New chat page — user yahan prompt type karta hai

import { Header } from '@/app/components/header/Header';
import { Homepage } from '@/app/components/Homepage.client';

export const metadata = {
  title: 'Sverkos | Generate full-stack apps with AI',
  description: 'Build full-stack apps instantly with AI — just describe what you want.',
  openGraph: {
    images: ['/social_preview_index.png'],
  },
};

export default function ChatPage() {
  return (
    <div className="flex size-full flex-col bg-bolt-elements-background-depth-1">
      <Header />
      <Homepage />
    </div>
  );
}