import { auth, currentUser } from "@clerk/nextjs/server";
import HeroSection from '@/components/HeroSection'
import CapabilitiesSection from '@/components/CapabilitiesSection'

export default async function Home() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col bg-gray-50">
      {user ? (
        <div className="flex flex-col items-center justify-center flex-1 p-24 text-center">
          <h1 className="mb-4 text-2xl font-bold">
            Welcome, {user.firstName ?? user.username ?? "there"}
          </h1>
          <p className="text-gray-600">
            You&apos;re signed in. Use the profile button in the nav to manage your account.
          </p>
        </div>
      ) : (
        <>
          <HeroSection />
          <CapabilitiesSection />
        </>
      )}
    </main>
  );
}