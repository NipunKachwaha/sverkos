// components/Navbar.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm mb-6">
      <h1 className="text-xl font-bold">My App</h1>
      
      <div>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {session.user?.name}</span>
            <button 
              onClick={() => signOut()} 
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => signIn('google')} 
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Google
            </button>
            <button 
              onClick={() => signIn('github')} 
              className="px-4 py-2 text-white bg-gray-800 rounded hover:bg-gray-900"
            >
              GitHub
            </button>
            <button 
              onClick={() => signIn('apple')} 
              className="px-4 py-2 text-white bg-black rounded hover:bg-gray-800"
            >
              Apple
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}