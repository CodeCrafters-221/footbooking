import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReservationModal from "../components/ReservationModal";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { decodeSanitizedString } from "../utils/security";
import { ReportService } from "../services/ReportService";
import {
  useAvailability,
  useTerrainData,
  useTerrainImageManager,
  useTerrainReviews,
} from "../hooks/useTerrainDetailsLogic";
import { useFavorites } from "../hooks/useFavorites";
import {
  Trophy,
  Search,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  Share2,
  Heart,
  Shirt,
  ShowerHead,
  SquareParking,
  Wifi,
  Lightbulb,
  Calendar,
  Clock,
  ArrowRight,
  Camera,
  Phone,
  MessageCircle,
  Flag,
} from "lucide-react";

export default function TerrainDetails() {
  const { id } = useParams();
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { user, profile } = useAuth();
  const fileInputRef = useRef(null);
  const { terrain, setTerrain, isLoading } = useTerrainData(id);
  const {
    reviews,
    ratingStats,
    isSubmittingReview,
    newReview,
    setNewReview,
    reviewsPage,
    setReviewsPage,
    handleReviewSubmit,
  } = useTerrainReviews(id, user);
  const {
    isUploadingImage,
    handleImageClick,
    handleImageUpload,
    handleDeleteImage,
  } = useTerrainImageManager({
    user,
    terrain,
    setTerrain,
    fileInputRef,
  });

  // États pour la pagination des avis
  const reviewsPerPage = 2;

  // États pour la pagination du calendrier (semaines)
  const [calendarWeek, setCalendarWeek] = useState(0); // 0 = cette semaine, 1 = semaine suivante...

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const { availableSlots, loadingSlots } = useAvailability(id, selectedDate);

  useEffect(() => {
    setSelectedTimeSlot("");
  }, [selectedDate]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Impossible de copier le lien");
    }
  };

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const isSaved = terrain ? isFavorite(terrain.id) : false;
  
  const handleSave = () => {
    if (!user) {
      toast.info("Veuillez vous connecter pour sauvegarder ce terrain.");
      return;
    }
    toggleFavorite(terrain);
    if (!isSaved) {
      toast.success("Terrain ajouté aux favoris !");
    } else {
      toast.info("Terrain retiré des favoris.");
    }
  };

  const handleReportTerrain = async ({ type, description }) => {
    try {
      await ReportService.createReport({
        report_type: "terrain",
        subject: type,
        description,
        target_type: "terrain",
        target_label: terrain.name,
      });
      toast.success("Signalement envoyé ! Notre équipe va l'examiner.");
      setIsReportOpen(false);
    } catch (err) {
      console.error("Erreur lors du signalement:", err);
      toast.error(
        err?.message ||
          "Une erreur est survenue lors de l'envoi du signalement.",
      );
    }
  };

  const totalReviewsPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = useMemo(
    () =>
      reviews.slice(
        (reviewsPage - 1) * reviewsPerPage,
        reviewsPage * reviewsPerPage,
      ),
    [reviews, reviewsPage, reviewsPerPage],
  );

  if (isLoading) {
    return (
      <div className="bg-background-dark min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!terrain) {
    return (
      <div className="bg-background-dark min-h-screen flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Terrain non trouvé</h2>
        <Link to="/" className="text-primary hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const basePrice = terrain.price_per_hour || terrain.price || 0;
  // const serviceFee = 1000;
  const totalPrice = basePrice;

  const stadiumDataForModal = {
    id: terrain.id,
    city: terrain.name,
    price: basePrice,
    location: terrain.adress,
    totalPlayers: terrain.type,
    fieldStadium: terrain.pelouse,
    notes: ratingStats?.average?.toString() || "N/A",
    image:
      terrain.field_images?.[0]?.url_image ||
      "https://placehold.co/600x400?text=No+Image",
    proprietaire_id: terrain.proprietaire_id,
  };
  return (
    <div className="bg-background-dark relative text-white font-display antialiased overflow-x-hidden selection:bg-primary selection:text-white min-h-screen pb-20">
      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-10 py-6 pb-20">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {terrain.name}
            </h1>
            {terrain.field_source === 'admin' && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  Terrain non partenaire
                </span>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  Disponibilité à confirmer
                </span>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Réservation via contact direct
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-text-secondary text-sm md:text-base">
              <span className="flex items-center gap-1">
                <MapPin className="text-primary w-5 h-5" />
                {terrain.adress}
              </span>
              <span className="w-1 h-1 rounded-full bg-text-secondary"></span>
              <span className="flex items-center gap-1">
                <Star className="text-primary w-5 h-5 fill-current" />
                <span className="text-white font-semibold">
                  {ratingStats.average}
                </span>
                <span>({ratingStats.count} avis)</span>
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {user && terrain && user.id === terrain.proprietaire_id && (
              <button
                onClick={handleImageClick}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
              >
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Camera className="w-[18px] h-[18px]" />
                )}
                Ajouter photo
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-light bg-surface-dark hover:bg-surface-light text-white text-sm font-medium transition-colors"
            >
              <Share2 className="w-[18px] h-[18px]" />
              Partager
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border border-surface-light bg-surface-dark hover:bg-surface-light text-sm font-medium transition-colors ${isSaved ? "text-primary" : "text-white"}`}
            >
              <Heart
                className={`w-[18px] h-[18px] ${isSaved ? "fill-primary" : ""}`}
              />
              {isSaved ? "Sauvegardé" : "Sauvegarder"}
            </button>
            {!(user?.id === terrain.proprietaire_id) && (
              <button
                onClick={() => {
                  if (!user) {
                    toast.info(
                      "Veuillez vous connecter pour signaler ce terrain.",
                    );
                    return;
                  }
                  setIsReportOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
                title="Signaler un problème"
              >
                <Flag className="w-[18px] h-[18px]" />
                Signaler
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-10 h-auto md:h-[480px] rounded-2xl overflow-hidden">
          {/* Main Image */}
          <div className="col-span-2 md:row-span-2 h-[200px] md:h-auto relative group cursor-pointer">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('${terrain.field_images?.[0]?.url_image || "https://placehold.co/600x400?text=No+Image"}')`,
              }}
            ></div>
            {user?.id === terrain.proprietaire_id &&
              terrain.field_images?.[0] && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  {/* <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteImage(terrain.field_images[0].url_image); }}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-black/50 pointer-events-auto"
                  title="Supprimer l'image"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button> */}
                </div>
              )}
          </div>
          {/* Secondary Images - Mapping real images */}
          {terrain.field_images?.slice(1, 4).map((img, idx) => (
            <div
              key={idx}
              className="relative group cursor-pointer h-[100px] md:h-auto"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${img.url_image}')` }}
              ></div>
              {user?.id === terrain.proprietaire_id && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(img.url_image);
                    }}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-black/50 pointer-events-auto"
                    title="Supprimer l'image"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Fallback if less than 5 images */}
          {(!terrain.field_images || terrain.field_images.length < 5) &&
            Array.from({
              length: Math.max(0, 4 - (terrain.field_images?.length || 1)),
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                onClick={handleImageClick}
                className={`relative group flex h-[100px] md:h-auto bg-surface-dark/50 items-center justify-center border border-dashed border-surface-highlight ${user?.id === terrain.proprietaire_id ? "cursor-pointer hover:bg-surface-light/10" : "opacity-50 cursor-not-allowed"}`}
              >
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-8 h-8 text-surface-highlight opacity-40 mb-2" />
                    {user?.id === terrain.proprietaire_id && (
                      <span className="text-xs text-text-secondary opacity-70">
                        Ajouter photo
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {terrain.field_images?.length >= 5 && (
            <div className="relative group cursor-pointer h-[100px] md:h-auto">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${terrain.field_images[4].url_image}')`,
                }}
              ></div>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/80 transition-colors">
                <span className="text-white font-bold text-lg">
                  +{terrain.field_images.length - 5}
                </span>
              </div>
              {user?.id === terrain.proprietaire_id && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(terrain.field_images[4].url_image);
                    }}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-black/50 pointer-events-auto"
                    title="Supprimer l'image"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-12">
            {/* Description */}
            <section>
              <h3 className="text-2xl font-black italic text-white mb-4">
                À propos de ce terrain
              </h3>
              <div className="text-[#cbad90] leading-relaxed space-y-4 font-medium">
                <p>
                  {terrain.description ||
                    "Aucune description disponible pour ce terrain."}
                </p>
              </div>
            </section>

            {/* Amenities */}
            <section className="border-t border-surface-light pt-8">
              <h3 className="text-2xl font-black italic text-white mb-6">
                Équipements et services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-surface-light">
                  <Shirt className="text-primary w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Vestiaires
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-surface-light">
                  <SquareParking className="text-primary w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Parking
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-surface-light">
                  <Lightbulb className="text-primary w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Éclairage LED
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-surface-light">
                  <Trophy className="text-primary w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Ballons fournis
                  </span>
                </div>
              </div>
            </section>

            {/* Interactive Calendar Mockup */}
            {terrain.field_source !== 'admin' && (
              <section className="border-t border-surface-light pt-8">
                <h3 className="text-2xl font-black italic text-white mb-6">
                  Disponibilités
                </h3>
              <div className="bg-[#2c241b] rounded-3xl p-6 md:p-8 border border-[#493622] shadow-2xl">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() =>
                      setCalendarWeek((prev) => Math.max(0, prev - 1))
                    }
                    disabled={calendarWeek === 0}
                    className="p-2 hover:bg-primary/20 rounded-full text-[#cbad90] hover:text-primary transition-colors disabled:opacity-20"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <h4 className="text-lg font-black text-white uppercase tracking-widest">
                    {calendarWeek === 0
                      ? "Cette semaine"
                      : `Dans ${calendarWeek} semaine${calendarWeek > 1 ? "s" : ""}`}
                  </h4>
                  <button
                    onClick={() =>
                      setCalendarWeek((prev) => Math.min(3, prev + 1))
                    }
                    className="p-2 hover:bg-primary/20 rounded-full text-[#cbad90] hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2 text-center">
                  <span className="text-[10px] text-[#cbad90] uppercase font-bold tracking-tighter">
                    Lun
                  </span>
                  <span className="text-[10px] text-[#cbad90] uppercase font-bold tracking-tighter">
                    Mar
                  </span>
                  <span className="text-[10px] text-[#cbad90] uppercase font-bold tracking-tighter">
                    Mer
                  </span>
                  <span className="text-[10px] text-[#cbad90] uppercase font-bold tracking-tighter">
                    Jeu
                  </span>
                  <span className="text-[10px] text-[#cbad90] uppercase font-bold tracking-tighter">
                    Ven
                  </span>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-tighter">
                    Sam
                  </span>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-tighter">
                    Dim
                  </span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-3 mb-8">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(new Date().getDate() + calendarWeek * 7 + i);
                    const iso = d.toISOString().split("T")[0];
                    const isActive = iso === selectedDate;

                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={`py-3 px-1 rounded-full flex flex-col items-center justify-center transition-all min-w-0 ${
                          isActive
                            ? "bg-primary text-[#231a10] font-black shadow-[0_0_20px_rgba(242,127,13,0.3)] scale-105"
                            : "bg-[#231a10] text-white hover:bg-[#493622] border border-[#493622]"
                        }`}
                      >
                        <span className="text-base md:text-lg leading-none">
                          {d.getDate()}
                        </span>
                        <span className="text-[8px] md:text-[10px] uppercase opacity-70 font-bold mt-0.5">
                          {new Intl.DateTimeFormat("fr-FR", { month: "short" })
                            .format(d)
                            .replace(".", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots for selected day */}
                <div className="border-t border-[#493622] pt-6">
                  <p className="text-sm text-[#cbad90] font-bold uppercase tracking-widest mb-4">
                    Créneaux disponibles pour le{" "}
                    <span className="text-white">
                      {new Date(selectedDate).getDate()}{" "}
                      {new Intl.DateTimeFormat("fr-FR", {
                        month: "long",
                      }).format(new Date(selectedDate))}
                    </span>{" "}
                  </p>

                  {loadingSlots ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-[#cbad90] italic text-sm py-4 text-center bg-[#231a10]/50 rounded-xl border border-dashed border-[#493622]">
                      Aucun créneau disponible
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={` 
                            py-2.5 rounded-xl text-xs font-bold transition-all border
                            ${
                              !slot.available
                                ? "bg-[#231a10]/50 text-[#5d452b] line-through cursor-not-allowed border-transparent"
                                : selectedTimeSlot === slot.time
                                  ? "bg-primary text-[#231a10] shadow-lg border-primary scale-105"
                                  : "bg-[#231a10] text-[#cbad90] hover:border-primary/50 border-[#493622]"
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            )}

            {user && (
              <div className="mb-8 p-6 rounded-2xl bg-surface-dark border border-surface-light">
                <h4 className="text-white font-bold mb-4">Laisser un avis</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-text-secondary mr-2">
                      Votre note :
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setNewReview({ ...newReview, note: star })
                        }
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.note
                              ? "text-primary fill-current"
                              : "text-text-secondary"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReview.commentaire}
                    onChange={(e) =>
                      setNewReview({
                        ...newReview,
                        commentaire: e.target.value,
                      })
                    }
                    placeholder="Partagez votre expérience sur ce terrain..."
                    className="w-full bg-[#231a10] border border-surface-light rounded-xl p-4 text-white text-sm focus:border-primary outline-none transition-colors min-h-[100px]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2 bg-primary text-[#231a10] font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Envoi..." : "Publier l'avis"}
                  </button>
                </form>
              </div>
            )}
            {/* Reviews */}
            <section className="border-t border-surface-light pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black italic text-white">
                  Avis ({ratingStats.count})
                </h3>
                <div className="flex items-center gap-4">
                  {reviews.length > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setReviewsPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={reviewsPage === 1}
                        className="p-2 rounded-full border border-[#493622] text-[#cbad90] hover:text-white hover:bg-[#493622] transition-all disabled:opacity-20"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setReviewsPage((prev) =>
                            Math.min(totalReviewsPages, prev + 1),
                          )
                        }
                        disabled={reviewsPage === totalReviewsPages}
                        className="p-2 rounded-full border border-[#493622] text-[#cbad90] hover:text-white hover:bg-[#493622] transition-all disabled:opacity-20"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Star className="text-primary w-5 h-5 fill-current" />
                    <span className="text-xl font-bold text-white">
                      {ratingStats.average}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Review Form */}

              <div className="relative">
                {reviews.length === 0 ? (
                  <p className="text-text-secondary italic text-center py-4">
                    Aucun avis pour le moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-[#2c241b] p-6 rounded-3xl border border-[#493622] flex flex-col gap-4 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="size-10 rounded-full bg-cover bg-center bg-[#493622]"
                              style={
                                review?.profiles?.image
                                  ? {
                                      backgroundImage: `url('${review.profiles.image}')`,
                                    }
                                  : {}
                              }
                            >
                              {!review?.profiles?.image && (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold uppercase">
                                  {review?.profiles?.name?.substring(0, 2) ||
                                    "??"}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm tracking-tight">
                                {review?.profiles?.name || "Anonyme"}
                              </p>
                              <p className="text-[10px] font-black uppercase text-[#cbad90] opacity-60">
                                {new Date(
                                  review?.created_at,
                                ).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-primary">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-[14px] h-[14px] ${
                                  i <= (review?.note || 0)
                                    ? "fill-current"
                                    : "opacity-30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="bg-[#231a10]/50 rounded-2xl p-4 border border-[#493622]/50 italic">
                          <p className="text-[#cbad90] text-sm leading-relaxed">
                            "{decodeSanitizedString(review?.commentaire || '')}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Map */}
            <section className="border-t border-surface-light pt-8">
              <h3 className="text-xl font-bold text-white mb-6">Emplacement</h3>
              <div className="w-full h-72 bg-surface-dark rounded-3xl overflow-hidden border border-surface-highlight shadow-inner">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(terrain.adress + ", Dakar, Senegal")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    filter:
                      "grayscale(1) contrast(1.2) invert(0.9) hue-rotate(180deg)",
                  }}
                  allowFullScreen=""
                  loading="lazy"
                  title={`Carte de ${terrain.name}`}
                ></iframe>
              </div>
              <p className="mt-4 text-text-secondary text-sm">
                {terrain.adress}, Dakar, Sénégal
              </p>
            </section>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 bg-[#2c241b] rounded-[2rem] p-8 border border-[#493622] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {terrain.field_source === 'admin' ? (
                <div>
                  <div className="mb-6 border-b border-[#493622] pb-6">
                    <span className="text-3xl font-black text-white block tracking-tighter">
                      Prix sur demande
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Contacter le terrain</h3>
                  <p className="text-[#cbad90] text-sm leading-relaxed mb-6">
                    Les disponibilités et le prix de ce terrain doivent être confirmés directement avec le propriétaire.
                  </p>
                  <div className="space-y-4">
                    <a 
                      href={`https://wa.me/${(terrain.telephone || terrain.phone || '').replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#20bd5a] active:scale-[0.98] transition-all shadow-lg hover:shadow-[#25D366]/20 shadow-[#25D366]/20 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Contacter via WhatsApp
                    </a>
                    <a 
                      href={`tel:${terrain.telephone || terrain.phone || ''}`}
                      className="w-full bg-surface-light text-white font-bold py-3.5 rounded-xl hover:bg-surface-highlight active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-[#493622]"
                    >
                      <Phone className="w-5 h-5" />
                      Appeler
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-8 border-b border-[#493622] pb-6">
                    <div>
                      <span className="text-3xl font-black text-white block tracking-tighter">
                        {(
                          terrain.price_per_hour ||
                          terrain.price ||
                          0
                        ).toLocaleString()}{" "}
                        FCFA
                      </span>
                      <span className="text-[#cbad90] text-xs font-bold uppercase tracking-widest">
                        par heure de jeu
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-light px-2 py-1 rounded-md">
                      <Star className="text-primary w-4 h-4 fill-current" />
                      <span className="text-white font-bold text-sm">
                        {ratingStats.average}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8">
                    {/* Date/Time Display */}
                    <div className="bg-[#231a10] rounded-2xl p-4 border border-[#493622] flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#cbad90] uppercase font-black tracking-widest">
                          Date
                        </span>
                        <span className="text-white font-bold capitalize">
                          {new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(new Date(selectedDate))}
                        </span>
                      </div>
                      <Calendar className="text-primary w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="bg-[#231a10] rounded-2xl p-4 border border-[#493622] flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#cbad90] uppercase font-black tracking-widest">
                          Horaire
                        </span>
                        <span className="text-white font-bold">
                          {selectedTimeSlot ? (
                            selectedTimeSlot
                          ) : (
                            <span className="text-text-secondary/70 italic text-xs">
                              A sélectionner
                            </span>
                          )}
                        </span>
                      </div>
                      <Clock className="text-primary w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  {/* Breakdown */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-text-secondary text-sm">
                      <span>{basePrice.toLocaleString()} x 1 heure</span>
                      <span>{basePrice.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-sm">
                      <span>Frais de service</span>
                      <span>
                        Gratuit
                      </span>
                    </div>
                    <div className="h-px bg-surface-light my-2"></div>
                    <div className="flex justify-between text-white font-bold text-base">
                      <span>Total</span>
                      <span>{totalPrice.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                  {/* CTA */}
                  <div className="p-4 bg-surface-dark border-t border-surface-highlight">
                    <button
                      onClick={() => setIsReservationOpen(true)}
                      className="w-full bg-primary text-black font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg hover:shadow-primary/20 shadow-primary/20 flex flex-col items-center"
                    >
                      <span className="text-base sm:text-lg">
                        Réserver ce terrain
                      </span>
                      <span className="text-xs font-medium opacity-90 mt-0.5">
                        Paiement sécurisé par Wave
                      </span>
                    </button>
                  </div>
                  <p className="text-center text-xs text-text-secondary mt-4">
                    Aucun débit immédiat. Annulation gratuite jusqu'à 24h avant.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      {isReservationOpen && (
        <ReservationModal
          isOpen={isReservationOpen}
          onClose={() => setIsReservationOpen(false)}
          stadium={stadiumDataForModal}
          initialDate={selectedDate}
          initialTimeSlot={selectedTimeSlot}
        />
      )}
      {isReportOpen && (
        <ReportModal
          isOpen
          onClose={() => setIsReportOpen(false)}
          title="Signaler ce terrain"
          subtitle={`Signaler un problème concernant « ${terrain.name} »`}
          typeOptions={[
            { value: "Terrain non conforme", label: "Terrain non conforme" },
            { value: "Photos trompeuses", label: "Photos trompeuses" },
            { value: "Prix incorrect", label: "Prix incorrect" },
            { value: "Autre", label: "Autre" },
          ]}
          onSubmit={handleReportTerrain}
        />
      )}
    </div>
  );
}
