import Hero from "../sections/Hero";
import Features from "../sections/Features";
import SEO from "../components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="Accueil" 
        description="Trouvez et réservez facilement des terrains de sport près de chez vous. Footbooking est la plateforme numéro 1 pour les passionnés de football."
        url="https://footbooking.online/"
      />
      <Hero />
      <Features />
    </>
  );
}
