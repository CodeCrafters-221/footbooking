import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StadiumCard from "../components/StadiumCard";
import ReservationModal from "../components/ReservationModal";
import Cta2 from "../components/Cta2";
import FadeIn from "../components/FadeIn";

// Images
import firstStadiumCard from "../assets/img/field1.jpg";
import secondStadiumCard from "../assets/img/field2.jpg";
import thirdStadiumCard from "../assets/img/field3.jpg";

import { supabase } from "../services/supabaseClient";
import { toast } from "react-toastify";
import { useFavorites } from "../hooks/useFavorites";
import { useAuth } from "../context/AuthContext";

export default function Features() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [stadiums, setStadiums] = useState([]);
  const [filteredStadiums, setFilteredStadiums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États Modales
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(null);

  // --- FETCH REAL STADIUMS FOR HOME PAGE (LIMIT 3) ---
  useEffect(() => {
    const fetchHomeStadiums = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("fields")
          .select(`
            *,
            field_images (url_image)
          `)
          .is("deleted_at", null)
          .limit(3)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((f) => ({
            id: f.id,
            city: f.name,
            price: f.price_per_hour || f.price || 0,
            location: f.adress,
            totalPlayers: f.nombre_de_joueurs,
            fieldStadium: f.pelouse,
            notes: "4.8",
            image: f.field_images?.[0]?.url_image || firstStadiumCard,
            proprietaire_id: f.proprietaire_id
          }));

          // Si on a moins de 3 terrains en base, on complète avec des terrains statiques
          // pour toujours remplir la grille (3 colonnes) sur l'accueil
          const finalStadiums = [...mapped];
          const placeholders = [
            {
              id: "p1",
              city: "Terrain Mermoz Pro",
              price: 25000,
              location: "Dakar, Mermoz",
              totalPlayers: "",
              fieldStadium: "Terrain Synthétique",
              notes: "4.9",
              image: secondStadiumCard
            },
            {
              id: "p2",
              city: "Galaxy Foot",
              price: 30000,
              location: "Dakar, Almadies",
              totalPlayers: "",
              fieldStadium: "Terrain Synthétique",
              notes: "4.7",
              image: thirdStadiumCard
            },
            {
              id: "p3",
              city: "Almadies Turf",
              price: 20000,
              location: "Dakar, Ngor",
              totalPlayers: "",
              fieldStadium: "Terrain Synthétique",
              notes: "4.6",
              image: firstStadiumCard
            }
          ];

          while (finalStadiums.length < 3 && placeholders.length > 0) {
            finalStadiums.push(placeholders.shift());
          }

          setStadiums(finalStadiums);
          setFilteredStadiums(finalStadiums);
        }

      } catch (err) {
        console.error("Error fetching home stadiums:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeStadiums();
  }, []);

  // --- LOGIQUE DE FILTRAGE ---
  useEffect(() => {
    if (stadiums.length === 0) return;

    const query = searchParams.get("q")?.toLowerCase() || "";
    const city = searchParams.get("city") || "";

    const results = stadiums.filter((stadium) => {
      const matchText =
        stadium.city.toLowerCase().includes(query) ||
        stadium.location.toLowerCase().includes(query);
      const matchCity = city ? stadium.location.includes(city) : true;
      return matchText && matchCity;
    });

    setFilteredStadiums(results);
  }, [searchParams, stadiums]);

  // --- HANDLERS ---
  const handleReserve = (stadiumId) => {
    const stadium = stadiums.find((s) => s.id === stadiumId);
    setSelectedStadium(stadium);
    setIsReservationOpen(true);
  };

  const handleCloseReservation = () => {
    setIsReservationOpen(false);
    setTimeout(() => setSelectedStadium(null), 300);
  };

  const handleFavorite = (stadiumId) => {
    if (!user) {
      toast.info("Veuillez vous connecter pour sauvegarder ce terrain.");
      return;
    }
    const stadium = stadiums.find((s) => s.id === stadiumId);
    if(stadium) {
      const isSaved = isFavorite(stadiumId);
      toggleFavorite(stadium);
      if (!isSaved) {
        toast.success("Terrain ajouté aux favoris !");
      } else {
        toast.info("Terrain retiré des favoris.");
      }
    }
  };

  return (
    <>
      <div
        id="stadiums-list"
        className="featuresSection container mx-auto px-4 py-8 scroll-mt-24"
      >
        <FadeIn>
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 px-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {searchParams.get("q") || searchParams.get("city")
                  ? `Résultats de recherche (${filteredStadiums.length})`
                  : "Terrains à la une"}
              </h2>
              <p className="text-gray-400 mt-2">
                {searchParams.get("q") || searchParams.get("city")
                  ? "Voici les terrains correspondant à vos critères"
                  : "Les terrains les plus populaires de la semaine"}
              </p>
            </div>

            {(searchParams.get("q") || searchParams.get("city")) && (
              <Link
                to="/"
                className="text-primary hover:underline text-sm font-semibold"
              >
                Tout afficher
              </Link>
            )}
          </div>
        </FadeIn>

        {/* LISTE FILTRÉE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStadiums.length > 0 ? (
            filteredStadiums.map((stadium, index) => (
              <FadeIn key={stadium.id} delay={(index % 3) * 0.15}>
                <div className="relative group h-full">
                  <StadiumCard
                    id={stadium.id}
                    city={stadium.city}
                    price={stadium.price}
                    location={stadium.location}
                    totalPlayers={stadium.totalPlayers}
                    fieldStadium={stadium.fieldStadium}
                    notes={stadium.notes}
                    image={stadium.image}
                    onReserve={handleReserve}
                    onFavorite={handleFavorite}
                    isFavorite={isFavorite(stadium.id)}
                    isPlaceholder={stadium.id.toString().startsWith('p')}
                  />
                </div>
              </FadeIn>
            ))


          ) : (
            <div className="w-full text-center py-12 bg-[#2e2318] rounded-2xl border border-[#493622] col-span-full">
              <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">
                sentiment_dissatisfied
              </span>
              <p className="text-white text-lg">
                Aucun terrain ne correspond à votre recherche.
              </p>
              <Link
                to="/"
                className="text-primary hover:underline mt-2 inline-block"
              >
                Voir tous les terrains
              </Link>
            </div>
          )}
        </div>

        <FadeIn delay={0.2}>
          <div className="mt-16">
            <Cta2 />
          </div>
        </FadeIn>

        {/* --- MODAL DE RÉSERVATION --- */}
        {/* Plus besoin de passer onLogin ou onRegister car le modal utilise navigate() maintenant */}
      </div>
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={handleCloseReservation}
        stadium={selectedStadium}
      />
    </>
  );
}
