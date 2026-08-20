import { useState } from "react";
import { X } from "lucide-react";

export default function ConfirmModalEnhanced({
	isOpen,
	action,
	booking,
	loading,
	onConfirm,
	onCancel,
}) {
	const [reason, setReason] = useState("");

	if (!isOpen || !action) return null;

	const titles = {
		validate: "Valider la réservation",
		cancel: "Annuler la réservation",
		mark_paid: "Marquer comme payée",
	};

	const messages = {
		validate: `Valider la réservation de ${booking?.client_name || "ce client"} sur ${booking?.fields?.name || "ce terrain"} ?`,
		cancel:
			"Êtes-vous sûr de vouloir annuler cette réservation ?",
		mark_paid:
			"Confirmer le paiement de cette réservation ?",
	};

	const buttonColors = {
		validate: "bg-green-500 hover:bg-green-600",
		cancel: "bg-red-500 hover:bg-red-600",
		mark_paid: "bg-blue-500 hover:bg-blue-600",
	};

	const handleConfirm = () => {
		onConfirm(action, reason);
		setReason("");
	};

	const handleCancel = () => {
		setReason("");
		onCancel();
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-[#2c241b] border border-[#493622] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
				{/* Header */}
				<div className="flex justify-between items-start">
					<h2 className="text-lg font-black text-white">
						{titles[action]}
					</h2>
					<button
						onClick={handleCancel}
						className="p-1 text-[#cbad90] hover:text-white"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Message */}
				<p className="text-[#cbad90] text-sm leading-relaxed">
					{messages[action]}
				</p>

				{/* Raison (pour annulation) */}
				{action === "cancel" && (
					<div className="space-y-2">
						<label className="block text-xs font-bold text-white uppercase tracking-wide">
							Raison de l'annulation
						</label>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Indiquez la raison de cette annulation (optionnel)..."
							maxLength={200}
							className="w-full p-3 bg-[#1c1610] border border-[#493622] rounded-lg text-white text-sm focus:outline-none focus:border-primary resize-none"
							rows={3}
						/>
						<p className="text-[10px] text-gray-500 text-right">
							{reason.length}/200
						</p>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-3 pt-4 border-t border-[#493622]">
					<button
						onClick={handleCancel}
						disabled={loading}
						className="flex-1 px-4 py-2.5 rounded-lg border border-[#493622] text-[#cbad90] font-semibold text-sm hover:bg-[#493622]/30 transition-all disabled:opacity-50"
					>
						Annuler
					</button>
					<button
						onClick={handleConfirm}
						disabled={loading}
						className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 ${buttonColors[action]}`}
					>
						{loading ? "Traitement..." : titles[action]}
					</button>
				</div>
			</div>
		</div>
	);
}
