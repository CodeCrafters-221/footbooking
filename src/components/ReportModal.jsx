import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";

const ReportModal = ({
  isOpen,
  onClose,
  title = "Signaler un problème",
  subtitle = "Votre signalement sera examiné par notre équipe.",
  typeOptions = [],
  onSubmit,
  submitLabel = "Envoyer le signalement",
}) => {
  const [selectedType, setSelectedType] = useState(
    typeOptions[0]?.value || "",
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ type: selectedType, description: description.trim() });
    } catch (err) {
      console.error("Erreur lors de l'envoi du signalement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e160f] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] flex flex-col border border-[#493622] shadow-2xl">
        {/* Header */}
        <div className="flex-none px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-[#493622] flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 shrink-0 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <Flag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-lg md:text-xl font-black italic leading-tight">
                {title}
              </h3>
              <p className="text-[#cbad90] text-xs md:text-sm mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-[#2c241b] text-[#cbad90] hover:text-white hover:bg-[#3d2e1e] transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
              Motif du signalement <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
              Détails <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème rencontré..."
              className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-4 md:px-6 py-4 md:py-5 border-t border-[#493622] flex gap-3">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-[#493622] text-[#cbad90] font-bold text-sm hover:bg-[#2c241b] transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            className="flex-1 py-3 rounded-xl bg-red-500/90 text-white font-black text-sm hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;