import Navbar from "@/src/components/landing/Navbar";
import HeroSection from "components/landing/HeroSection";
import FeaturesSection from "@/src/components/landing/FeaturesSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
