import React, { useState } from "react";
import { Heart, MapPin, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StadiumCard({
  id,
  city,
  location,
  price,
  totalPlayers,
  notes,
  fieldStadium,
  image,
  onReserve,
  onFavorite,
  isFavorite = false,
  isPlaceholder = false,
  fieldSource = "owner",
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleReserve = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isPlaceholder) {
      navigate("/search");
      return;
    }
    if (fieldSource === "admin") {
      navigate(`/terrain-details/${id}`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (onReserve) {
        await onReserve(id);
      }
    } catch (err) {
      setError("Erreur lors de la réservation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onFavorite) {
      onFavorite(id);
    }
  };

  return (
    <div 
      onClick={() => {
        if (!isPlaceholder) {
          navigate(`/terrain-details/${id}`);
        } else {
          navigate("/search");
        }
      }}
      className={`w-full h-full flex flex-col bg-[#2e2318] rounded-2xl overflow-hidden shadow-lg border border-[#493622] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer`}>
      {/* Image Container */}
      <figure className="relative h-44 sm:h-48 flex-shrink-0 group overflow-hidden">
        {fieldSource === "admin" && (
          <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 uppercase tracking-widest shadow-md backdrop-blur-md">
            Non partenaire
          </div>
        )}
        <img
          src={image}
          alt={`Terrain ${city}`}
          className={`object-cover w-full h-full transition-all duration-700 group-hover:scale-110`}
          onError={(e) => {
            e.target.src = "/placeholder-stadium.jpg";
          }}
        />

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-primary transition-colors group z-10 backdrop-blur-md"
          aria-label="Ajouter aux favoris"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isFavorite ? "fill-white text-white" : "text-white"}`}
          />
        </button>
      </figure>

      <div className="flex flex-col gap-3 p-4 flex-grow">
        {/* Title and Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className={`text-white text-lg font-bold leading-tight transition-colors ${!isPlaceholder && 'hover:text-primary'}`}>
            {city}
          </h3>
          <div className="text-right shrink-0">
            {fieldSource === "admin" ? (
              <span className="text-primary font-bold text-sm">Prix sur demande</span>
            ) : (
              <>
                <span className="text-primary font-bold ">{price} CFA</span>
                <span className="text-white text-xs font-normal">/h</span>
              </>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center">
          <MapPin className="text-[#cbad90] w-4 h-4 mr-2 flex-shrink-0" />
          <p className="text-[#cbad90] text-sm truncate">{location}</p>
        </div>

        {/* Badges */}
        <div className="card-details flex flex-wrap gap-2 items-center justify-between mt-auto pt-2">
          <div className="flex gap-2">
            <Badge label={totalPlayers} />
            <Badge label={fieldStadium} />
          </div>
          <RatingBadge rating={notes} />
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Action Button */}
        <button
          onClick={handleReserve}
          disabled={isLoading}
          className={`w-full mt-2 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isPlaceholder
            ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            : fieldSource === "admin"
            ? "bg-transparent text-primary border border-primary hover:bg-primary/10"
            : "bg-primary text-black hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20"
            } disabled:opacity-50`}
        >
          {isLoading ? (
            "Chargement..."
          ) : isPlaceholder ? (
            <>
              Trouver un terrain
              <ArrowRight className="w-4 h-4" />
            </>
          ) : fieldSource === "admin" ? (
            "Voir les détails"
          ) : (
            "Réserver"
          )}
        </button>
      </div>
    </div>
  );
}

// Composant Badge réutilisable
function Badge({ label }) {
  return (
    <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#342618] text-[#cbad90] rounded-2xl border border-[#493622]">
      {label}
    </div>
  );
}

// Composant Rating réutilisable
function RatingBadge({ rating }) {
  return (
    <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-4full tracking-wider text-white text-[10px] font-bold flex items-center">
      <Star className="text-primary w-3.5 h-3.5 mr-1 fill-current" />
      {rating}
    </div>
  );
}
