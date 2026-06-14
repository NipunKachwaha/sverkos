// app/chat/[id]/page.tsx
// Converted from Remix: routes/chat.$id.tsx

import { Header } from '@/app/components/header/Header';
import { ExistingChat } from '@/app/components/ExistingChat.client';

interface ChatPageProps {
  params: {
    id: string;
  };
  searchParams: {
    code?: string;
  };
}

export function generateMetadata() {
  return { title: 'Sverkos' };
}

export default function ChatPage({ params, searchParams }: ChatPageProps) {
  if (!params.id) {
    // Next.js mein redirect
    return null;
  }

  return (
    <div className="flex size-full flex-col bg-bolt-elements-background-depth-1">
      <Header />
      {/* ClientOnly replacement — Next.js mein 'use client' component use karo */}
      <ExistingChat chatId={params.id} />
    </div>
  );
}