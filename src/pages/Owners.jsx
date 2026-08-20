import Header from "../components/Header";
import Footer from "../components/Footer";

import OwnersHero from "../sections/owners/OwnersHero";
import OwnersStats from "../sections/owners/OwnersStats";
import OwnersFeatures from "../sections/owners/OwnersFeatures";
import OwnersPreview from "../sections/owners/OwnersPreview";
import OwnersCTA from "../sections/owners/OwnersCTA";

export default function Owners() {
  return (
    <div className="min-h-screen w-full bg-background-dark text-white">
      <Header />
      <main className="flex flex-col relative z-0">
        <OwnersHero />
        <OwnersStats />
        <OwnersFeatures />
        <OwnersPreview />
        <OwnersCTA />
      </main>
      <Footer />
    </div>
  );
}
