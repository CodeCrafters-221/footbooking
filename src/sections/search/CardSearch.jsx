import { SearchX, Zap, Heart, MapPin, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import FadeIn from "../../components/FadeIn";

const CardSearch = ({ terrains, onReserve, onFavorite, favorites = [] }) => {
  if (terrains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <SearchX className="w-16 h-16 text-text-secondary mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-white mb-2">
          Aucun terrain trouvé
        </h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Essayez d'ajuster vos filtres (prix, quartier) pour dénicher la perle
          rare sur Footbooking.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {terrains.map((terrain, index) => (
          <FadeIn key={terrain.id} delay={(index % 3) * 0.1}>
          <div
            className="group bg-surface-dark border border-surface-highlight rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 flex flex-col relative h-full"
          >
            {/* Image Container */}
            <Link
              to={`/terrain-details/${terrain.id}`}
              className="relative aspect-[16/10] overflow-hidden block"
            >
              <div className="absolute inset-0  bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 flex items-start justify-between  p-2 gap-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFavorite && onFavorite(terrain.id);
                  }}
                  className={`p-2 rounded-full backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-110 active:scale-90 group/btn ${
                    favorites.includes(terrain.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-black/40 text-white hover:bg-white hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`w-[18px] h-[18px] transition-transform group-hover/btn:scale-110 ${favorites.includes(terrain.id) ? "fill-current" : ""}`}
                  />
                </button>
                <div className="flex gap-2 mt-2">
                  {terrain.isAvailable && (
                    <span className="bg-primary/90 backdrop-blur-sm text-background-dark text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-primary/20">
                      <Zap className="size-4" fill="currentColor" />
                      Dispo
                    </span>
                  )}
                </div>
              </div>

              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                src={terrain.image}
                alt={terrain.name}
              />
            </Link>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 gap-3 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/terrain-details/${terrain.id}`}>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {terrain.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1.5 text-text-secondary mt-1.5 group-hover:text-white/80 transition-colors">
                    <MapPin className="w-[14px] h-[14px] text-primary" />
                    <span className="text-sm font-medium">
                      {terrain.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-surface-highlight/50 px-2 py-1 rounded-lg border border-white/5">
                  <Star className="w-[14px] h-[14px] text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-bold">
                    {terrain.rating}
                  </span>
                  <span className="text-text-secondary text-xs">
                    ({terrain.reviews})
                  </span>
                </div>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-surface-highlight to-transparent w-full my-1 opacity-50"></div>

              <div className="flex justify-between items-center mt-auto pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-text-secondary uppercase tracking-wide font-semibold opacity-70">
                    Prix / heure
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {terrain.price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-primary">F</span>
                  </div>
                </div>
                <button
                  onClick={() => onReserve(terrain)}
                  className="relative overflow-hidden px-6 py-2.5 bg-white text-background-dark hover:text-white rounded-full text-sm font-bold transition-all duration-300 group/btn shadow-lg shadow-white/5 hover:shadow-primary/30 z-0"
                >
                  <span className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 -z-10 ease-out"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    Réserver
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover/btn:translate-x-1" />
                  </span>
                </button>
              </div>
            </div>
          </div>
          </FadeIn>
        ))}
      </div>
    </>
  );
};

export default CardSearch;
