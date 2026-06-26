import HeroSection from '@/app/components/homepage/HeroSection'
import CapabilitiesSection from '@/app/components/homepage/CapabilitiesSection'

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CapabilitiesSection />
    </main>
  );
}