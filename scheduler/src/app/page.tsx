/**
 * Home page
 *
 * Landing page entry point that renders the main layout:
 * Navbar, Hero section, and Features section.
 */

import Navbar from "@/components/landing/Navbar";
import HeroSection from "components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StarBackground from "@/components/StarBackground";

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-950 text-white">
			<StarBackground />
			<Navbar />
			<HeroSection />
			<FeaturesSection />
		</div>
	);
}
