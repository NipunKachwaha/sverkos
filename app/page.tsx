import HeroSection from '@/components/HeroSection'
import CapabilitiesSection from '@/components/CapabilitiesSection'

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CapabilitiesSection />
    </main>
  );
}