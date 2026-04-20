import { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Star,
  Loader2,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ReviewService } from "../../services/ReviewService";
import { ReservationService } from "../../services/ReservationService";
import { toast } from "react-toastify";
import { decodeSanitizedString } from "../../utils/security";

// Modal pour laisser un avis sur un terrain spécifique
export const ReviewModal = ({ isOpen, onClose, terrain, onReviewed }) => {
  const { user } = useAuth();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note === 0) {
      toast.error("Veuillez donner une note (étoiles)");
      return;
    }
    if (!commentaire.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    setIsSubmitting(true);
    try {
      await ReviewService.addReview({
        utilisateur_id: user.id,
        terrain_id: terrain?.field_id || terrain?.id,
        note: note,
        commentaire: commentaire,
      });
      toast.success("Merci pour votre avis !");
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#2e2318] border border-surface-highlight w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-xl font-bold">
            Avis : {terrain?.terrainName || terrain?.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-text-secondary text-sm">
              Votre note pour ce terrain
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNote(i)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 ${i <= note ? "text-primary fill-current" : "text-text-secondary"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Votre commentaire
            </label>
            <textarea
              className="w-full bg-background-dark/50 border border-surface-highlight rounded-2xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] resize-none"
              placeholder="Comment s'est passé votre match ? Pelouse, accueil, éclairage..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-[#d96f0b] text-background-dark font-bold py-4 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? "Envoi en cours..." : "Publier mon avis"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Avis = () => {
  const { user } = useAuth();
  const [userReviews, setUserReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour le formulaire direct
  const [latestPendingMatch, setLatestPendingMatch] = useState(null);
  const [newReview, setNewReview] = useState({ note: 0, commentaire: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pagination avis
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(
    window.innerWidth < 768 ? 1 : 2,
  );

  // Gérer la réactivité du nombre d'avis par page
  useEffect(() => {
    const handleResize = () => {
      const newPerPage = window.innerWidth < 768 ? 1 : 2;
      if (newPerPage !== reviewsPerPage) {
        setReviewsPerPage(newPerPage);
        setCurrentPage(1); // Reset à la page 1 pour éviter les bugs d'index
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [reviewsPerPage]);

  const fetchUserReviews = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Récupérer les avis
      const { data: reviewsData, error: reviewsError } =
        await ReviewService.getUserReviews(user.id);
      if (reviewsError) throw reviewsError;
      const reviews = reviewsData || [];
      setUserReviews(reviews);

      // 2. Récupérer les réservations
      const reservations = await ReservationService.getUserReservations();

      // 3. Matcher
      const reviewedTerrainIds = reviews.map((r) => r.terrain_id);
      const toReview = (reservations || []).find(
        (res) => res.field_id && !reviewedTerrainIds.includes(res.field_id),
      );

      setLatestPendingMatch(toReview || null);
    } catch (err) {
      console.error("Erreur Avis/Matchs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReviews();
  }, [user]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!latestPendingMatch) {
      toast.info(
        "Veuillez sélectionner un match dans votre historique pour laisser un avis",
      );
      return;
    }
    if (newReview.note === 0) {
      toast.error("Veuillez sélectionner une note (étoiles)");
      return;
    }
    if (!newReview.commentaire.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    setIsSubmitting(true);
    try {
      await ReviewService.addReview({
        utilisateur_id: user.id,
        terrain_id: latestPendingMatch.field_id,
        note: newReview.note,
        commentaire: newReview.commentaire,
      });
      toast.success("Avis publié !");
      setNewReview({ note: 0, commentaire: "" });
      setCurrentPage(1);
      fetchUserReviews();
    } catch (err) {
      console.error("Erreur publication:", err);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcul pagination avis
  const totalPages = Math.ceil(userReviews.length / reviewsPerPage);
  const paginatedReviews = userReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage,
  );

  return (
    <>
      <div
        className="flex flex-col gap-6 pt-6 border-t border-surface-highlight"
        id="avis"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white text-2xl font-bold leading-tight">
            Mes Avis Publiés
          </h2>
          <span className="bg-surface-highlight/50 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {userReviews.length} avis
          </span>
        </div>

        {/* SECTION FORMULAIRE DIRECT */}
        <div className="bg-surface-dark border border-surface-highlight rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

          <div className="relative flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <MessageSquarePlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    Laisser un avis
                  </h3>
                  <p className="text-text-secondary text-xs">
                    {latestPendingMatch
                      ? `Évaluez votre dernier match à ${latestPendingMatch.terrainName}`
                      : "Partagez votre expérience sur vos matchs"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
                  Notez le terrain :
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, note: star })}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= newReview.note
                            ? "text-primary fill-current"
                            : "text-surface-highlight"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <textarea
                  className="w-full bg-background-dark/30 border border-surface-highlight rounded-2xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none transition-all"
                  placeholder={
                    latestPendingMatch
                      ? `Comment était le terrain ${latestPendingMatch.terrainName} ?`
                      : "Aucun match récent à évaluer..."
                  }
                  value={newReview.commentaire}
                  onChange={(e) =>
                    setNewReview({ ...newReview, commentaire: e.target.value })
                  }
                  disabled={!latestPendingMatch}
                />
                {!latestPendingMatch && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/60 backdrop-blur-[1px] rounded-2xl">
                    <p className="text-xs text-text-secondary text-center px-6">
                      {userReviews.length > 0
                        ? "Tous vos matchs récents ont déjà un avis ! Merci."
                        : "Faites un match pour laisser votre premier avis !"}
                      <br />
                      Ou utilisez le bouton <b>"Laisser un avis"</b> dans
                      l'historique.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end min-w-[140px]">
              <button
                onClick={handlePublish}
                disabled={isSubmitting || !latestPendingMatch}
                className="w-full bg-primary hover:bg-[#d96f0b] text-background-dark font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Publier</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* LISTE DES AVIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center p-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : paginatedReviews.length > 0 ? (
            paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl bg-surface-dark p-6 border border-surface-highlight flex flex-col gap-4 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20 group-hover:bg-primary group-hover:text-background-dark transition-colors">
                      {review.fields?.name?.substring(0, 1) || "T"}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">
                        {review.fields?.name || "Terrain"}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        Match du{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-[18px] h-[18px] ${i <= review.note ? "fill-current" : "text-surface-highlight"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-[#231a10]/50 rounded-xl p-4 border border-white/5 italic">
                  <p className="text-text-secondary text-sm">
                    "{decodeSanitizedString(review.commentaire)}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-surface-dark/30 rounded-3xl p-16 border border-dashed border-surface-highlight flex flex-col items-center justify-center text-center">
              <Star className="w-12 h-12 text-surface-highlight opacity-40 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Aucun avis</h3>
              <p className="text-text-secondary text-sm">
                Votre historique d'avis apparaîtra ici.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Avis */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-12 rounded-xl border border-surface-highlight bg-background-dark text-white flex items-center justify-center hover:border-primary disabled:opacity-30 transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-primary font-black text-lg">
                {currentPage}
              </span>
              <span className="text-[#cbad90] font-bold text-xs uppercase tracking-widest">
                / {totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-12 rounded-xl border border-surface-highlight bg-background-dark text-white flex items-center justify-center hover:border-primary disabled:opacity-30 transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Avis;
export { Avis as UserAvis };
