import Header from "../components/Header";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

import OwnersHero from "../sections/owners/OwnersHero";
import OwnersStats from "../sections/owners/OwnersStats";
import OwnersFeatures from "../sections/owners/OwnersFeatures";
import OwnersPreview from "../sections/owners/OwnersPreview";
import OwnersCTA from "../sections/owners/OwnersCTA";

export default function Owners() {
  return (
    <div className="min-h-screen w-full bg-background-dark text-white">
      <SEO 
        title="Pour les Propriétaires" 
        description="Gérez vos terrains de sport, suivez vos réservations et augmentez vos revenus avec la meilleure solution de gestion pour les complexes sportifs."
        url="https://footbooking.online/owners"
      />
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
