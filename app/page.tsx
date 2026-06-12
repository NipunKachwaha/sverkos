import HeroSection from '@/app/components/HeroSection'
import CapabilitiesSection from '@/app/components/CapabilitiesSection'

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CapabilitiesSection />
    </main>
  );
}